<script setup lang="ts">
// Marca do DevBook: "< >" num quadrado na cor de destaque. As cores vêm dos
// tokens, então acompanha o tema. O public/favicon.svg é a mesma figura.
withDefaults(defineProps<{ tamanho?: number }>(), { tamanho: 26 })
</script>

<template>
  <svg :width="tamanho" :height="tamanho" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect width="24" height="24" rx="6" fill="var(--primaria)" />
    <path
      d="M9.5 8 6 12l3.5 4M14.5 8 18 12l-3.5 4"
      fill="none"
      stroke="var(--texto-sobre-cor)"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
