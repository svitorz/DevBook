import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { ApiError, SEM_CONEXAO } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'
import LoginView from './LoginView.vue'

async function montar(url = '/entrar') {
  const router = criarRouter(createMemoryHistory())
  await router.push(url)
  const wrapper = mount(LoginView, { global: { plugins: [router] } })
  return { wrapper, router }
}

async function preencherEEnviar(wrapper: Awaited<ReturnType<typeof montar>>['wrapper']) {
  await wrapper.get('input[type=email]').setValue('ana@devbook.dev')
  await wrapper.get('input[type=password]').setValue('Senha@123')
  await wrapper.get('form').trigger('submit')
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
})

describe('LoginView', () => {
  it('entra e vai para o destino do ?redirect=', async () => {
    const login = vi.spyOn(usuariosApi, 'login').mockResolvedValue({ id: 4, token: 'tok' })
    const { wrapper, router } = await montar('/entrar?redirect=/%3Faba%3D2')

    await preencherEEnviar(wrapper)
    await flushPromises()

    expect(login).toHaveBeenCalledWith('ana@devbook.dev', 'Senha@123')
    expect(useSessaoStore().usuarioId).toBe(4)
    expect(router.currentRoute.value.fullPath).toBe('/?aba=2')
  })

  it('redirect externo é ignorado: vai para o início', async () => {
    vi.spyOn(usuariosApi, 'login').mockResolvedValue({ id: 4, token: 'tok' })
    const { wrapper, router } = await montar('/entrar?redirect=//malicioso.example')

    await preencherEEnviar(wrapper)
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('credenciais erradas mostram a mensagem da API e continuam na tela', async () => {
    vi.spyOn(usuariosApi, 'login').mockRejectedValue(new ApiError(401, 'e-mail ou senha inválidos'))
    const { wrapper, router } = await montar()

    await preencherEEnviar(wrapper)
    await flushPromises()

    expect(wrapper.get('[role=alert]').text()).toBe('e-mail ou senha inválidos')
    expect(router.currentRoute.value.name).toBe('entrar')
    expect(useSessaoStore().estaLogado).toBe(false)
  })

  it('API fora do ar mostra o erro de conexão', async () => {
    vi.spyOn(usuariosApi, 'login').mockRejectedValue(
      new ApiError(SEM_CONEXAO, 'Não foi possível conectar à API.'),
    )
    const { wrapper } = await montar()

    await preencherEEnviar(wrapper)
    await flushPromises()

    expect(wrapper.get('[role=alert]').text()).toBe('Não foi possível conectar à API.')
  })

  it('desabilita o botão enquanto envia (evita duplo clique)', async () => {
    let resolver!: (v: { id: number; token: string }) => void
    vi.spyOn(usuariosApi, 'login').mockReturnValue(new Promise((r) => (resolver = r)))
    const { wrapper } = await montar()

    await preencherEEnviar(wrapper)
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()

    resolver({ id: 1, token: 't' })
    await flushPromises()
  })

  it('vindo do cadastro, avisa que a conta foi criada', async () => {
    const { wrapper } = await montar('/entrar?conta=criada')
    expect(wrapper.get('[role=status]').text()).toContain('Conta criada')
  })

  it('tem link para o cadastro', async () => {
    const { wrapper } = await montar()
    expect(wrapper.find('a[href="/cadastro"]').exists()).toBe(true)
  })
})
