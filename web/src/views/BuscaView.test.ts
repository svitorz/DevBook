import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import App from '../App.vue'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'

function usuario(id: number): Usuario {
  return { id, nome: `Nome ${id}`, nick: `u${id}`, email: `u${id}@x.test`, criadoem: '2026-01-15T12:00:00Z' }
}

const montados: { unmount(): void }[] = []

async function abrir(url: string) {
  const router = criarRouter(createMemoryHistory())
  await router.push(url)
  const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
  montados.push(wrapper)
  await vi.waitFor(() => expect(wrapper.find('input[type=search]').exists()).toBe(true))
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
  const sessao = useSessaoStore()
  sessao.token = 'tok'
  sessao.usuarioId = 1
  vi.spyOn(usuariosApi, 'obter').mockResolvedValue(usuario(1)) // o cabeçalho carrega o usuário logado
  vi.spyOn(usuariosApi, 'seguindo').mockResolvedValue([]) // quem eu sigo (botões Seguir)
})

afterEach(() => {
  vi.useRealTimers()
  montados.splice(0).forEach((w) => w.unmount())
})

describe('BuscaView', () => {
  it('buscar põe o termo na URL e lista os resultados com link para o perfil', async () => {
    const buscar = vi.spyOn(usuariosApi, 'buscar').mockResolvedValue([usuario(5)])
    const { wrapper, router } = await abrir('/buscar')

    await wrapper.get('input[type=search]').setValue('  ana ')
    await wrapper.get('form[role=search]').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.query.q).toBe('ana')
    expect(buscar).toHaveBeenCalledWith('ana')
    expect(wrapper.get('a[href="/perfil/5"]').text()).toContain('@u5')
  })

  it('abrir /buscar?q= já busca (link compartilhável, F5)', async () => {
    const buscar = vi.spyOn(usuariosApi, 'buscar').mockResolvedValue([])
    const { wrapper } = await abrir('/buscar?q=bob')

    expect(buscar).toHaveBeenCalledWith('bob')
    expect((wrapper.get('input[type=search]').element as HTMLInputElement).value).toBe('bob')
    expect(wrapper.text()).toContain('Ninguém encontrado para “bob”.')
  })

  it('termo vazio não chama a API (vazio listaria todo mundo)', async () => {
    const buscar = vi.spyOn(usuariosApi, 'buscar')
    const { wrapper } = await abrir('/buscar')

    await wrapper.get('input[type=search]').setValue('   ')
    await wrapper.get('form[role=search]').trigger('submit')
    await flushPromises()

    expect(buscar).not.toHaveBeenCalled()
  })

  it('busca enquanto digita, 300 ms depois da última tecla, sem empilhar histórico', async () => {
    vi.useFakeTimers()
    const buscar = vi.spyOn(usuariosApi, 'buscar').mockResolvedValue([usuario(5)])
    const { wrapper, router } = await abrir('/buscar')
    const replace = vi.spyOn(router, 'replace')
    const push = vi.spyOn(router, 'push')

    await wrapper.get('input[type=search]').setValue('an')
    vi.advanceTimersByTime(200)
    await wrapper.get('input[type=search]').setValue('ana')
    vi.advanceTimersByTime(299)
    expect(buscar).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(buscar).toHaveBeenCalledOnce()
    expect(buscar).toHaveBeenCalledWith('ana')
    expect(replace).toHaveBeenCalledWith({ query: { q: 'ana' } })
    expect(push).not.toHaveBeenCalled()
    expect(wrapper.get('a[href="/perfil/5"]').text()).toContain('@u5')
  })

  it('apagar o termo limpa os resultados e a URL', async () => {
    vi.useFakeTimers()
    vi.spyOn(usuariosApi, 'buscar').mockResolvedValue([usuario(5)])
    const { wrapper, router } = await abrir('/buscar?q=ana')
    expect(wrapper.find('a[href="/perfil/5"]').exists()).toBe(true)

    await wrapper.get('input[type=search]').setValue('')
    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBeUndefined()
    expect(wrapper.find('a[href="/perfil/5"]').exists()).toBe(false)
  })

  it('resposta atrasada de um termo antigo não sobrescreve a do termo atual', async () => {
    let responderAntiga!: (v: Usuario[]) => void
    vi.spyOn(usuariosApi, 'buscar').mockImplementation((t) =>
      t === 'a' ? new Promise((r) => (responderAntiga = r)) : Promise.resolve([usuario(7)]),
    )
    const { wrapper, router } = await abrir('/buscar')
    await router.replace({ query: { q: 'a' } })
    await router.replace({ query: { q: 'ab' } })
    await flushPromises()
    responderAntiga([usuario(5)])
    await flushPromises()

    expect(wrapper.find('a[href="/perfil/7"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/perfil/5"]').exists()).toBe(false)
  })

  it('cada resultado tem Seguir (menos eu mesmo)', async () => {
    vi.spyOn(usuariosApi, 'buscar').mockResolvedValue([usuario(5), usuario(1)])
    const seguir = vi.spyOn(usuariosApi, 'seguir').mockResolvedValue(undefined)
    const { wrapper } = await abrir('/buscar?q=u')
    expect(wrapper.find('[data-testid=seguir-1]').exists()).toBe(false)

    await wrapper.get('[data-testid=seguir-5]').trigger('click')
    await flushPromises()
    expect(seguir).toHaveBeenCalledWith(5)
    expect(wrapper.get('[data-testid=seguir-5]').text()).toBe('Deixar de seguir')
  })

  it('o campo já vem com o cursor', async () => {
    const { wrapper } = await abrir('/buscar')
    expect(document.activeElement).toBe(wrapper.get('input[type=search]').element)
  })
})
