// Quem o usuário logado segue, para os botões Seguir nas listas (C3).
// A API não diz "eu sigo esta pessoa?" em cada usuário; uma chamada a
// /usuarios/{eu}/seguindo responde para a lista inteira.
// Como nas outras escritas, o estado só muda depois que a API confirmou.

import { ref } from 'vue'
import { usuariosApi } from '../api/endpoints'
import { useSessaoStore } from '../stores/sessao'

export function useQuemEuSigo() {
  const sessao = useSessaoStore()
  const ids = ref(new Set<number>())
  const pronto = ref(false) // sem a lista não dá para saber o estado: a tela esconde os botões

  async function carregar() {
    if (sessao.usuarioId === null) return
    try {
      const seguindo = await usuariosApi.seguindo(sessao.usuarioId)
      ids.value = new Set(seguindo.map((u) => u.id))
      pronto.value = true
    } catch {
      pronto.value = false
    }
  }

  const sigo = (id: number) => ids.value.has(id)

  /** Segue (true) ou deixa de seguir (false). Erro propaga para quem clicou. */
  async function definir(id: number, seguir: boolean) {
    if (seguir) await usuariosApi.seguir(id)
    else await usuariosApi.pararDeSeguir(id)
    const novo = new Set(ids.value)
    if (seguir) novo.add(id)
    else novo.delete(id)
    ids.value = novo
  }

  return { pronto, sigo, carregar, definir }
}
