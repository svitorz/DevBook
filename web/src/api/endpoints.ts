// Um função por endpoint da API. As views não montam URL nem método.

import { request } from './client'
import type {
  DadosPerfil,
  DadosPublicacao,
  NovoUsuario,
  Publicacao,
  Sessao,
  Usuario,
} from './types'

const u = (id: number) => `/usuarios/${id}`
const p = (id: number) => `/publicacoes/${id}`

export const usuariosApi = {
  cadastrar: (dados: NovoUsuario) => request<Usuario>('POST', '/usuarios', dados),
  login: (email: string, senha: string) => request<Sessao>('POST', '/login', { email, senha }),
  buscar: (nomeOuNick: string) =>
    request<Usuario[]>('GET', `/usuarios?usuario=${encodeURIComponent(nomeOuNick)}`),
  obter: (id: number) => request<Usuario>('GET', u(id)),
  atualizar: (id: number, dados: DadosPerfil) => request<void>('PUT', u(id), dados),
  deletar: (id: number) => request<void>('DELETE', u(id)),
  seguir: (id: number) => request<void>('POST', `${u(id)}/seguir`),
  pararDeSeguir: (id: number) => request<void>('POST', `${u(id)}/parar-de-seguir`),
  seguidores: (id: number) => request<Usuario[]>('GET', `${u(id)}/seguidores`),
  seguindo: (id: number) => request<Usuario[]>('GET', `${u(id)}/seguindo`),
  atualizarSenha: (id: number, atual: string, nova: string) =>
    // 401 aqui = senha atual errada, não sessão expirada
    request<void>('POST', `${u(id)}/atualizar-senha`, { atual, nova }, { ignorar401DeSessao: true }),
}

export const publicacoesApi = {
  criar: (dados: DadosPublicacao) => request<Publicacao>('POST', '/publicacoes', dados),
  feed: () => request<Publicacao[]>('GET', '/publicacoes'),
  obter: (id: number) => request<Publicacao>('GET', p(id)),
  doUsuario: (usuarioId: number) => request<Publicacao[]>('GET', `/publicacoes/usuario/${usuarioId}`),
  atualizar: (id: number, dados: DadosPublicacao) => request<void>('PUT', p(id), dados),
  deletar: (id: number) => request<void>('DELETE', p(id)),
  curtir: (id: number) => request<void>('POST', `${p(id)}/curtir`),
  descurtir: (id: number) => request<void>('POST', `${p(id)}/descurtir`),
}
