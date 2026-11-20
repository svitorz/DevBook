// Sessão do usuário: token + id, persistidos no localStorage (decisão da fase B).

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'

const CHAVE = 'devbook.sessao'

interface SessaoSalva {
  id: number
  token: string
}

function lerSalva(): SessaoSalva | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return null
    const s = JSON.parse(bruto) as Partial<SessaoSalva>
    return typeof s.id === 'number' && typeof s.token === 'string' ? { id: s.id, token: s.token } : null
  } catch {
    return null // storage bloqueado ou valor corrompido: começa deslogado
  }
}

function salvar(s: SessaoSalva | null) {
  try {
    if (s) localStorage.setItem(CHAVE, JSON.stringify(s))
    else localStorage.removeItem(CHAVE)
  } catch {
    // sem storage a sessão vale só até recarregar a página
  }
}

export const useSessaoStore = defineStore('sessao', () => {
  const inicial = lerSalva()
  const token = ref<string | null>(inicial?.token ?? null)
  const usuarioId = ref<number | null>(inicial?.id ?? null)

  const estaLogado = computed(() => token.value !== null)

  // Nome e nick para o cabeçalho (fase C1). Não vai para o storage: é buscado
  // de novo a cada carga, então uma edição de perfil nunca fica velha.
  const usuario = ref<Usuario | null>(null)

  async function carregarUsuario() {
    if (usuarioId.value === null) return
    try {
      usuario.value = await usuariosApi.obter(usuarioId.value)
    } catch {
      // o cabeçalho funciona sem os dados (mostra "?"); um 401 já encerra a sessão no cliente
    }
  }

  async function entrar(email: string, senha: string) {
    const sessao = await usuariosApi.login(email, senha)
    token.value = sessao.token
    usuarioId.value = sessao.id
    salvar(sessao)
  }

  function sair() {
    token.value = null
    usuarioId.value = null
    usuario.value = null
    salvar(null)
  }

  return { token, usuarioId, usuario, estaLogado, entrar, sair, carregarUsuario }
})
