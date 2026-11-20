<script setup lang="ts">
import { computed } from 'vue'
import { corDoAvatar, iniciais } from '../utils/avatar'

// Decorativo: quem usa o avatar põe o nome da pessoa em texto ou aria-label.
const props = withDefaults(defineProps<{ nome: string; semente: string; tamanho?: number }>(), { tamanho: 32 })

const estilo = computed(() => ({
  width: `${props.tamanho}px`,
  height: `${props.tamanho}px`,
  fontSize: `${Math.round(props.tamanho * 0.4)}px`,
  background: corDoAvatar(props.semente),
}))
</script>

<template>
  <span class="avatar" :style="estilo" aria-hidden="true">{{ iniciais(nome) }}</span>
</template>
