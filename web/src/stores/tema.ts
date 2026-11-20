// Tema claro/escuro (fase C0). Sem escolha salva, segue o sistema; ao alternar,
// a escolha vai para o localStorage e passa a valer sobre o sistema.
// O index.html aplica a escolha salva antes do primeiro paint (mesma CHAVE).

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type Tema = 'claro' | 'escuro'

const CHAVE = 'devbook.tema'

function lerEscolha(): Tema | null {
  try {
    const v = localStorage.getItem(CHAVE)
    return v === 'claro' || v === 'escuro' ? v : null
  } catch {
    return null
  }
}

function salvarEscolha(t: Tema) {
  try {
    localStorage.setItem(CHAVE, t)
  } catch {
    // sem storage a escolha vale só até recarregar
  }
}

// O CSS lê data-tema no <html>; sem o atributo, vale o prefers-color-scheme.
function aplicar(t: Tema | null) {
  if (t) document.documentElement.dataset.tema = t
  else delete document.documentElement.dataset.tema
}

export const useTemaStore = defineStore('tema', () => {
  const escolha = ref<Tema | null>(lerEscolha())

  const consulta = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
  const sistema = ref<Tema>(consulta?.matches ? 'escuro' : 'claro')
  consulta?.addEventListener('change', (e) => {
    sistema.value = e.matches ? 'escuro' : 'claro'
  })

  const atual = computed<Tema>(() => escolha.value ?? sistema.value)

  function alternar() {
    escolha.value = atual.value === 'escuro' ? 'claro' : 'escuro'
    salvarEscolha(escolha.value)
    aplicar(escolha.value)
  }

  aplicar(escolha.value)
  return { atual, alternar }
})
