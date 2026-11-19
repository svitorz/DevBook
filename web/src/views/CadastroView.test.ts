import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { ApiError } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'
import CadastroView from './CadastroView.vue'

const DADOS = { nome: 'Ana Lima', nick: 'ana', email: 'ana@devbook.dev', senha: 'Senha@123' }

async function montarEEnviar() {
  const router = criarRouter(createMemoryHistory())
  await router.push('/cadastro')
  const wrapper = mount(CadastroView, { global: { plugins: [router] } })
  await wrapper.get('input[name=nome]').setValue(` ${DADOS.nome} `)
  await wrapper.get('input[name=nick]').setValue(DADOS.nick)
  await wrapper.get('input[name=email]').setValue(DADOS.email)
  await wrapper.get('input[name=senha]').setValue(DADOS.senha)
  await wrapper.get('form').trigger('submit')
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
})

describe('CadastroView', () => {
  it('cria a conta, já entra e vai para o início', async () => {
    const cadastrar = vi
      .spyOn(usuariosApi, 'cadastrar')
      .mockResolvedValue({ id: 9, nome: DADOS.nome, nick: 'ana', email: DADOS.email, criadoem: '' })
    const login = vi.spyOn(usuariosApi, 'login').mockResolvedValue({ id: 9, token: 'tok' })

    const { router } = await montarEEnviar()

    expect(cadastrar).toHaveBeenCalledWith(DADOS) // nome sem os espaços das pontas
    expect(login).toHaveBeenCalledWith(DADOS.email, DADOS.senha)
    expect(useSessaoStore().usuarioId).toBe(9)
    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('nick/e-mail em uso (409) mostra a mensagem e não tenta entrar', async () => {
    vi.spyOn(usuariosApi, 'cadastrar').mockRejectedValue(new ApiError(409, 'nick ou e-mail já está em uso'))
    const login = vi.spyOn(usuariosApi, 'login')

    const { wrapper, router } = await montarEEnviar()

    expect(wrapper.get('[role=alert]').text()).toBe('nick ou e-mail já está em uso')
    expect(login).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('cadastro')
  })

  it('senha fraca (400) mostra a regra que a API devolveu', async () => {
    vi.spyOn(usuariosApi, 'cadastrar').mockRejectedValue(
      new ApiError(400, 'a senha deve conter ao menos um número'),
    )
    const { wrapper } = await montarEEnviar()
    expect(wrapper.get('[role=alert]').text()).toBe('a senha deve conter ao menos um número')
  })

  it('conta criada mas login falhou: avisa e manda para /entrar', async () => {
    vi.spyOn(usuariosApi, 'cadastrar').mockResolvedValue({ id: 9, nome: '', nick: '', email: '', criadoem: '' })
    vi.spyOn(usuariosApi, 'login').mockRejectedValue(new ApiError(0, 'Não foi possível conectar à API.'))

    const { router } = await montarEEnviar()

    // /entrar é lazy: a navegação só termina depois que o chunk carrega
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('entrar'))
    expect(router.currentRoute.value.query.conta).toBe('criada')
  })
})
