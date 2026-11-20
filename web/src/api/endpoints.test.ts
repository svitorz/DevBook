import { afterEach, describe, expect, it, vi } from 'vitest'
import { configurarCliente } from './client'
import { usuariosApi } from './endpoints'

afterEach(() => {
  vi.unstubAllGlobals()
  configurarCliente({ token: () => null, aoExpirarSessao: () => {} })
})

function responder(status: number, corpo: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })),
  )
}

describe('usuariosApi.atualizarSenha', () => {
  // A API responde 401 quando a senha ATUAL está errada (contrato da fase 2).
  // Esse 401 vem com token válido e não pode ser tratado como sessão expirada.
  it('senha atual errada (401) não encerra a sessão', async () => {
    responder(401, { erro: 'crypto/bcrypt: hashedPassword is not the hash of the given password' })
    const aoExpirarSessao = vi.fn()
    configurarCliente({ token: () => 'valido', aoExpirarSessao })

    await expect(usuariosApi.atualizarSenha(1, 'errada', 'Nova@1234')).rejects.toMatchObject({ status: 401 })
    expect(aoExpirarSessao).not.toHaveBeenCalled()
  })

  it('outros endpoints continuam encerrando a sessão no 401', async () => {
    responder(401, { erro: 'token is expired' })
    const aoExpirarSessao = vi.fn()
    configurarCliente({ token: () => 'expirado', aoExpirarSessao })

    await expect(usuariosApi.obter(1)).rejects.toMatchObject({ status: 401 })
    expect(aoExpirarSessao).toHaveBeenCalledOnce()
  })
})
