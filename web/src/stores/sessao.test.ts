import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usuariosApi } from '../api/endpoints'
import { useSessaoStore } from './sessao'

const CHAVE = 'devbook.sessao'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
})

describe('sessão', () => {
  it('entrar guarda token e id no estado e no localStorage', async () => {
    vi.spyOn(usuariosApi, 'login').mockResolvedValue({ id: 7, token: 'tok' })
    const sessao = useSessaoStore()

    await sessao.entrar('a@b.c', 'Senha@123')

    expect(sessao.estaLogado).toBe(true)
    expect(sessao.usuarioId).toBe(7)
    expect(JSON.parse(localStorage.getItem(CHAVE)!)).toEqual({ id: 7, token: 'tok' })
  })

  it('login recusado não cria sessão', async () => {
    vi.spyOn(usuariosApi, 'login').mockRejectedValue(new Error('e-mail ou senha inválidos'))
    const sessao = useSessaoStore()

    await expect(sessao.entrar('a@b.c', 'x')).rejects.toThrow()
    expect(sessao.estaLogado).toBe(false)
    expect(localStorage.getItem(CHAVE)).toBeNull()
  })

  it('restaura a sessão salva ao recarregar', () => {
    localStorage.setItem(CHAVE, JSON.stringify({ id: 3, token: 'salvo' }))
    const sessao = useSessaoStore()
    expect(sessao.token).toBe('salvo')
    expect(sessao.usuarioId).toBe(3)
  })

  it('valor corrompido no storage começa deslogado', () => {
    localStorage.setItem(CHAVE, '{não é json')
    expect(useSessaoStore().estaLogado).toBe(false)
  })

  it('sair limpa estado e storage', () => {
    localStorage.setItem(CHAVE, JSON.stringify({ id: 3, token: 'salvo' }))
    const sessao = useSessaoStore()
    sessao.sair()
    expect(sessao.estaLogado).toBe(false)
    expect(localStorage.getItem(CHAVE)).toBeNull()
  })
})
