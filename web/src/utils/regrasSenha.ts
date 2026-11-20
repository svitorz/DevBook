// Espelho das regras de validarSenha (api/src/models/Usuarios.go), só para
// MOSTRAR o que falta enquanto a pessoa digita (C4). Não bloqueia o envio:
// a API continua sendo quem decide. Se a regra mudar lá, mude aqui também.

export interface RegraSenha {
  id: 'tamanho' | 'maiuscula' | 'minuscula' | 'numero' | 'especial'
  texto: string
  ok: boolean
}

// O len() do Go conta bytes (UTF-8), não letras: "é" vale 2.
const bytes = (s: string) => new TextEncoder().encode(s).length
// Mesmo conjunto da regex da API; ~, ` e espaço NÃO contam.
const ESPECIAL = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/

export function regrasDaSenha(senha: string): RegraSenha[] {
  return [
    { id: 'tamanho', texto: '8 ou mais caracteres', ok: bytes(senha) >= 8 },
    { id: 'maiuscula', texto: 'Uma letra maiúscula', ok: /[A-Z]/.test(senha) },
    { id: 'minuscula', texto: 'Uma letra minúscula', ok: /[a-z]/.test(senha) },
    { id: 'numero', texto: 'Um número', ok: /[0-9]/.test(senha) },
    { id: 'especial', texto: 'Um caractere especial (!@#$…)', ok: ESPECIAL.test(senha) },
  ]
}

export const senhaValida = (senha: string) => regrasDaSenha(senha).every((r) => r.ok)
