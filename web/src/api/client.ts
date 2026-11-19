// Cliente HTTP mínimo sobre fetch: JSON, header Authorization e erros
// padronizados ({"erro": "..."} da API vira ApiError com status e mensagem).

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** status 0 = não chegou resposta (API fora do ar, CORS, rede). */
export const SEM_CONEXAO = 0

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')

interface ConfigCliente {
  /** Token atual da sessão (ou null). */
  token: () => string | null
  /** Chamado quando a API recusa um token que foi enviado (expirado/inválido). */
  aoExpirarSessao: () => void
}

let config: ConfigCliente = {
  token: () => null,
  aoExpirarSessao: () => {},
}

export function configurarCliente(novo: ConfigCliente) {
  config = novo
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = config.token()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(SEM_CONEXAO, 'Não foi possível conectar à API.')
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && token) config.aoExpirarSessao()
    throw new ApiError(resposta.status, await mensagemDeErro(resposta))
  }

  if (resposta.status === 204) return undefined as T
  return (await resposta.json()) as T
}

async function mensagemDeErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { erro?: string }
    if (corpo.erro) return corpo.erro
  } catch {
    // corpo vazio ou não-JSON (ex.: 405 do router)
  }
  return `Erro ${resposta.status}`
}

/** Texto para mostrar ao usuário. A API já manda mensagens legíveis (e 5xx genérico). */
export function textoDoErro(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Erro inesperado. Tente de novo.'
}
