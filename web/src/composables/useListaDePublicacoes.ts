// Estado e ações de uma lista de publicações. Serve ao feed (B2) e às
// publicações de um perfil (B3): muda só a função que busca a lista.
//
// Ações de escrita propagam o erro (quem chamou mostra a mensagem perto do
// botão) e só mexem no estado local depois que a API confirmou.

import { ref } from 'vue'
import { textoDoErro } from '../api/client'
import { publicacoesApi } from '../api/endpoints'
import type { DadosPublicacao, Publicacao } from '../api/types'

export function useListaDePublicacoes(buscar: () => Promise<Publicacao[]>) {
  const publicacoes = ref<Publicacao[]>([])
  const carregando = ref(false)
  const erro = ref('')

  async function carregar() {
    carregando.value = true
    erro.value = ''
    try {
      publicacoes.value = await buscar()
    } catch (e) {
      publicacoes.value = []
      erro.value = textoDoErro(e)
    } finally {
      carregando.value = false
    }
  }

  // Recarrega em vez de inserir a resposta do POST: ela não traz autor_nick
  // e a data vem zerada (achado N14 da API).
  async function criar(dados: DadosPublicacao) {
    await publicacoesApi.criar(dados)
    await carregar()
  }

  function achar(id: number) {
    return publicacoes.value.find((p) => p.id === id)
  }

  async function editar(id: number, dados: DadosPublicacao) {
    await publicacoesApi.atualizar(id, dados)
    const p = achar(id)
    if (p) Object.assign(p, dados)
  }

  async function excluir(id: number) {
    await publicacoesApi.deletar(id)
    publicacoes.value = publicacoes.value.filter((p) => p.id !== id)
  }

  async function alternarCurtida(id: number) {
    const p = achar(id)
    if (!p) return
    if (p.curtiu) {
      await publicacoesApi.descurtir(id)
      p.curtiu = false
      p.curtidas = Math.max(0, p.curtidas - 1)
    } else {
      await publicacoesApi.curtir(id)
      p.curtiu = true
      p.curtidas += 1
    }
  }

  return { publicacoes, carregando, erro, carregar, criar, editar, excluir, alternarCurtida }
}
