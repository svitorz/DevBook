import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, SEM_CONEXAO, configurarCliente, request } from './client'

function respostaJson(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockFetch(resposta: Response | Error) {
  const fn = vi.fn(async () => {
    if (resposta instanceof Error) throw resposta
    return resposta
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
  configurarCliente({ token: () => null, aoExpirarSessao: () => {} })
})

describe('request', () => {
  it('envia JSON e o token no header Authorization', async () => {
    const fetch = mockFetch(respostaJson(201, { id: 1 }))
    configurarCliente({ token: () => 'abc', aoExpirarSessao: () => {} })

    const corpo = await request<{ id: number }>('POST', '/publicacoes', { titulo: 't' })

    expect(corpo).toEqual({ id: 1 })
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('http://localhost:5000/publicacoes')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"titulo":"t"}')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer abc', 'Content-Type': 'application/json' })
  })

  it('não envia Authorization sem sessão', async () => {
    const fetch = mockFetch(respostaJson(200, []))
    await request('GET', '/usuarios')
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it('204 resolve sem corpo', async () => {
    mockFetch(new Response(null, { status: 204 }))
    await expect(request('DELETE', '/publicacoes/1')).resolves.toBeUndefined()
  })

  it('transforma {"erro"} da API em ApiError com status', async () => {
    mockFetch(respostaJson(409, { erro: 'nick ou e-mail já está em uso' }))
    const erro = await request('POST', '/usuarios', {}).catch((e) => e)
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ status: 409, message: 'nick ou e-mail já está em uso' })
  })

  it('erro sem corpo JSON ainda vira ApiError', async () => {
    mockFetch(new Response('', { status: 405 }))
    await expect(request('GET', '/x')).rejects.toMatchObject({ status: 405, message: 'Erro 405' })
  })

  it('falha de rede vira ApiError com status SEM_CONEXAO', async () => {
    mockFetch(new TypeError('Failed to fetch'))
    await expect(request('GET', '/x')).rejects.toMatchObject({ status: SEM_CONEXAO })
  })

  it('401 com token enviado encerra a sessão', async () => {
    mockFetch(respostaJson(401, { erro: 'token is expired' }))
    const aoExpirarSessao = vi.fn()
    configurarCliente({ token: () => 'expirado', aoExpirarSessao })

    await expect(request('GET', '/publicacoes')).rejects.toMatchObject({ status: 401 })
    expect(aoExpirarSessao).toHaveBeenCalledOnce()
  })

  it('401 sem token (ex.: login com senha errada) não mexe na sessão', async () => {
    mockFetch(respostaJson(401, { erro: 'e-mail ou senha inválidos' }))
    const aoExpirarSessao = vi.fn()
    configurarCliente({ token: () => null, aoExpirarSessao })

    await expect(request('POST', '/login', {})).rejects.toMatchObject({ status: 401 })
    expect(aoExpirarSessao).not.toHaveBeenCalled()
  })
})
