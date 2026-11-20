<script setup lang="ts">
// O que a senha ainda precisa ter, marcado enquanto a pessoa digita (C4).
// É só orientação: a API continua validando (ver utils/regrasSenha.ts).
// Sem aria-live: anunciar a cada tecla seria ruído; o estado vai em texto
// oculto e é lido junto com a descrição do campo.
import { computed } from 'vue'
import { regrasDaSenha } from '../utils/regrasSenha'
import Icone from './Icone.vue'

const props = defineProps<{ senha: string }>()
const regras = computed(() => regrasDaSenha(props.senha))
</script>

<template>
  <ul class="regras-senha" data-testid="regras-senha">
    <li v-for="r in regras" :key="r.id" :class="{ ok: r.ok }">
      <Icone :nome="r.ok ? 'check' : 'circulo'" :tamanho="14" />
      {{ r.texto }}<span class="visualmente-oculto"> ({{ r.ok ? 'ok' : 'pendente' }})</span>
    </li>
  </ul>
</template>
