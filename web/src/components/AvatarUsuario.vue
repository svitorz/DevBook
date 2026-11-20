<script setup lang="ts">
import { computed } from 'vue'
import { corDoAvatar, iniciais } from '../utils/avatar'

// Decorativo: quem usa o avatar põe o nome da pessoa em texto ou aria-label.
// Iniciais e cor saem do nick (ver utils/avatar.ts).
const props = withDefaults(defineProps<{ nick: string; tamanho?: number }>(), { tamanho: 32 })

const estilo = computed(() => ({
  width: `${props.tamanho}px`,
  height: `${props.tamanho}px`,
  fontSize: `${Math.round(props.tamanho * 0.4)}px`,
  background: corDoAvatar(props.nick),
}))
</script>

<template>
  <span class="avatar" :style="estilo" aria-hidden="true">{{ iniciais(nick) }}</span>
</template>
