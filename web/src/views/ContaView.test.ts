import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { ApiError } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import App from '../App.vue'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'

const EU: Usuario = { id: 1, nome: 'Ana Lima', nick: 'ana', email: 'ana@x.test', criadoem: '2026-01-15T12:00:00Z' }

async function abrir() {
  const router = criarRouter(createMemoryHistory())
  await router.push('/conta')
  const wrapper = mount(App, { global: { plugins: [router] } })
  await vi.waitFor(() => expect(wrapper.find('[data-testid=form-perfil]').exists()).toBe(true))
  await flushPromises()
  return { wrapper, router }
}

const valor = (w: Awaited<ReturnType<typeof abrir>>['wrapper'], sel: string) =>
  (w.get(sel).element as HTMLInputElement).value

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
  const sessao = useSessaoStore()
  sessao.token = 'tok'
  sessao.usuarioId = EU.id
  vi.spyOn(usuariosApi, 'obter').mockResolvedValue({ ...EU })
})

describe('Minha conta: editar perfil', () => {
  it('vem preenchido com os dados atuais e salva sem espaços nas pontas', async () => {
    const atualizar = vi.spyOn(usuariosApi, 'atualizar').mockResolvedValue(undefined)
    const { wrapper } = await abrir()
    const form = '[data-testid=form-perfil]'
    expect(valor(wrapper, `${form} input[name=nick]`)).toBe('ana')

    await wrapper.get(`${form} input[name=nome]`).setValue(' Ana L. ')
    await wrapper.get(form).trigger('submit')
    await flushPromises()

    expect(atualizar).toHaveBeenCalledWith(1, { nome: 'Ana L.', nick: 'ana', email: 'ana@x.test' })
    expect(wrapper.get(`${form} [role=status]`).text()).toBe('Perfil atualizado.')
  })

  it('nick/e-mail de outro (409) mostra a mensagem da API', async () => {
    vi.spyOn(usuariosApi, 'atualizar').mockRejectedValue(new ApiError(409, 'nick ou e-mail já está em uso'))
    const { wrapper } = await abrir()
    await wrapper.get('[data-testid=form-perfil]').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[data-testid=form-perfil] [role=alert]').text()).toBe('nick ou e-mail já está em uso')
  })
})

describe('Minha conta: trocar senha', () => {
  const form = '[data-testid=form-senha]'
  async function preencher(w: Awaited<ReturnType<typeof abrir>>['wrapper'], atual: string, nova: string, confirmar: string) {
    await w.get(`${form} input[name=atual]`).setValue(atual)
    await w.get(`${form} input[name=nova]`).setValue(nova)
    await w.get(`${form} input[name=confirmar]`).setValue(confirmar)
    await w.get(form).trigger('submit')
    await flushPromises()
  }

  it('confirmação diferente não chama a API', async () => {
    const atualizarSenha = vi.spyOn(usuariosApi, 'atualizarSenha')
    const { wrapper } = await abrir()
    await preencher(wrapper, 'Velha@123', 'Nova@1234', 'Outra@1234')
    expect(atualizarSenha).not.toHaveBeenCalled()
    expect(wrapper.get(`${form} [role=alert]`).text()).toBe('A confirmação não confere com a nova senha.')
  })

  it('senha atual errada (401) vira mensagem clara e a sessão continua', async () => {
    vi.spyOn(usuariosApi, 'atualizarSenha').mockRejectedValue(
      new ApiError(401, 'crypto/bcrypt: hashedPassword is not the hash of the given password'),
    )
    const { wrapper, router } = await abrir()
    await preencher(wrapper, 'errada', 'Nova@1234', 'Nova@1234')
    expect(wrapper.get(`${form} [role=alert]`).text()).toBe('Senha atual incorreta.')
    expect(useSessaoStore().estaLogado).toBe(true)
    expect(router.currentRoute.value.name).toBe('conta')
  })

  it('sucesso limpa os campos e confirma', async () => {
    const atualizarSenha = vi.spyOn(usuariosApi, 'atualizarSenha').mockResolvedValue(undefined)
    const { wrapper } = await abrir()
    await preencher(wrapper, 'Velha@123', 'Nova@1234', 'Nova@1234')
    expect(atualizarSenha).toHaveBeenCalledWith(1, 'Velha@123', 'Nova@1234')
    expect(valor(wrapper, `${form} input[name=atual]`)).toBe('')
    expect(wrapper.get(`${form} [role=status]`).text()).toBe('Senha alterada.')
  })
})

describe('Minha conta: excluir conta', () => {
  const sec = '[data-testid=excluir-conta]'

  it('o botão só libera quando o nick é digitado exatamente', async () => {
    const { wrapper } = await abrir()
    const botao = () => wrapper.get(`${sec} button`)
    expect(botao().attributes('disabled')).toBeDefined()
    await wrapper.get(`${sec} input`).setValue('an')
    expect(botao().attributes('disabled')).toBeDefined()
    await wrapper.get(`${sec} input`).setValue('ana')
    expect(botao().attributes('disabled')).toBeUndefined()
  })

  it('exclui, encerra a sessão e vai para /entrar avisando', async () => {
    const deletar = vi.spyOn(usuariosApi, 'deletar').mockResolvedValue(undefined)
    const { wrapper, router } = await abrir()
    await wrapper.get(`${sec} input`).setValue('ana')
    await wrapper.get(`${sec} form`).trigger('submit')
    await flushPromises()

    expect(deletar).toHaveBeenCalledWith(1)
    expect(useSessaoStore().estaLogado).toBe(false)
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('entrar'))
    expect(router.currentRoute.value.query.conta).toBe('excluida')
    await flushPromises()
    expect(wrapper.get('[role=status]').text()).toContain('Conta excluída')
  })

  it('erro ao excluir mantém a sessão e mostra a mensagem', async () => {
    vi.spyOn(usuariosApi, 'deletar').mockRejectedValue(new ApiError(500, 'erro interno do servidor'))
    const { wrapper } = await abrir()
    await wrapper.get(`${sec} input`).setValue('ana')
    await wrapper.get(`${sec} form`).trigger('submit')
    await flushPromises()
    expect(useSessaoStore().estaLogado).toBe(true)
    expect(wrapper.get(`${sec} [role=alert]`).text()).toBe('erro interno do servidor')
  })
})

describe('cabeçalho', () => {
  it('tem o link Minha conta', async () => {
    const { wrapper } = await abrir()
    expect(wrapper.get('nav[aria-label=Principal] a[href="/conta"]').text()).toBe('Minha conta')
  })
})
