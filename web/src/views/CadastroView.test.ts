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

async function montarCadastro() {
  const router = criarRouter(createMemoryHistory())
  await router.push('/cadastro')
  return mount(CadastroView, { global: { plugins: [router] } })
}

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

  it('apresenta o DevBook ao lado do formulário', async () => {
    const w = await montarCadastro()
    expect(w.get('[data-testid=apresentacao]').text()).toContain('DevBook')
  })

  it('as regras da senha aparecem e vão sendo marcadas enquanto digita', async () => {
    const w = await montarCadastro()
    const regras = () => w.findAll('[data-testid=regras-senha] li')
    expect(regras()).toHaveLength(5)
    expect(regras().filter((li) => li.classes('ok'))).toHaveLength(0)

    await w.get('input[name=senha]').setValue('Senha1')
    expect(regras().filter((li) => li.classes('ok')).map((li) => li.text())).toEqual([
      expect.stringContaining('maiúscula'),
      expect.stringContaining('minúscula'),
      expect.stringContaining('número'),
    ])
    // o estado também vai em texto, para quem usa leitor de tela
    expect(regras()[0].text()).toContain('pendente')
    expect(regras()[1].text()).toContain('ok')
  })

  it('o campo de senha tem botão de mostrar', async () => {
    const w = await montarCadastro()
    await w.get('button[aria-label="Mostrar senha"]').trigger('click')
    expect(w.get('input[name=senha]').attributes('type')).toBe('text')
  })
})
