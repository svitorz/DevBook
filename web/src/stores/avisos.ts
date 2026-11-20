// Avisos curtos de confirmação ("Publicado."), que somem sozinhos (fase C2).
// Erros não passam por aqui: continuam perto do botão que falhou (decisão da B2).

import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Aviso {
  id: number
  texto: string
}

const DURACAO_MS = 3500

export const useAvisosStore = defineStore('avisos', () => {
  const avisos = ref<Aviso[]>([])
  let proximoId = 1

  function remover(id: number) {
    avisos.value = avisos.value.filter((a) => a.id !== id)
  }

  function avisar(texto: string) {
    const id = proximoId++
    avisos.value.push({ id, texto })
    setTimeout(() => remover(id), DURACAO_MS)
  }

  return { avisos, avisar, remover }
})
