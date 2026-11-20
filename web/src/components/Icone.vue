<script setup lang="ts">
// Ícones SVG próprios (decisão da fase C: sem biblioteca). Traço herda a cor do
// texto (currentColor). São decorativos: o nome acessível fica no botão/link.
// Novos ícones entram aqui quando uma tela precisar deles.
export type NomeIcone = 'sol' | 'lua' | 'casa' | 'busca' | 'usuario' | 'ajustes' | 'sair'

withDefaults(defineProps<{ nome: NomeIcone; tamanho?: number }>(), { tamanho: 18 })
</script>

<template>
  <svg
    :width="tamanho"
    :height="tamanho"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="nome === 'sol'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </template>
    <path v-else-if="nome === 'lua'" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    <path v-else-if="nome === 'casa'" d="M3 10.5 12 3l9 7.5M5 9v11a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9" />
    <template v-else-if="nome === 'busca'">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </template>
    <template v-else-if="nome === 'usuario'">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </template>
    <template v-else-if="nome === 'ajustes'">
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="18" r="2" />
    </template>
    <path v-else-if="nome === 'sair'" d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 17l5-5-5-5M21 12H9" />
  </svg>
</template>
