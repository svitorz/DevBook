import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import App from '../App.vue'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'

function usuario(id: number): Usuario {
  return { id, nome: `Nome ${id}`, nick: `u${id}`, email: `u${id}@x.test`, criadoem: '2026-01-15T12:00:00Z' }
}

async function abrir(url: string) {
  const router = criarRouter(createMemoryHistory())
  await router.push(url)
  const wrapper = mount(App, { global: { plugins: [router] } })
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
})

describe('cabeçalho logado', () => {
  it('tem links para Buscar e Meu perfil', async () => {
    vi.spyOn(usuariosApi, 'buscar').mockResolvedValue([])
    const { wrapper } = await abrir('/buscar')
    expect(wrapper.get('nav[aria-label=Principal] a[href="/buscar"]').text()).toBe('Buscar')
    expect(wrapper.get('nav[aria-label=Principal] a[href="/perfil/1"]').text()).toBe('Meu perfil')
  })
})
