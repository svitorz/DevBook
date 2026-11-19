// Tipos do contrato da API (ver tabela de endpoints no README e a seção
// "Contrato" do PROGRESS.md). Os nomes dos campos seguem o JSON da API.

export interface Usuario {
  id: number
  nome: string
  nick: string
  email: string
  criadoem: string
}

export interface Publicacao {
  id: number
  titulo: string
  conteudo: string
  autor_id: number
  autor_nick?: string
  curtidas: number
  criadaEm: string
}

/** Resposta do POST /login. */
export interface Sessao {
  id: number
  token: string
}

export interface NovoUsuario {
  nome: string
  nick: string
  email: string
  senha: string
}

export type DadosPerfil = Omit<NovoUsuario, 'senha'>

export interface DadosPublicacao {
  titulo: string
  conteudo: string
}
