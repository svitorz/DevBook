<script setup lang="ts">
import { useAvisosStore } from '../stores/avisos'

const avisos = useAvisosStore()
</script>

<template>
  <!-- A região existe sempre: leitores de tela só anunciam o que entra numa
       região aria-live que já estava na página. Sem role=status para não
       colidir com as mensagens role=status dos formulários. -->
  <div class="avisos" aria-live="polite">
    <p v-for="a in avisos.avisos" :key="a.id" class="aviso-toast">{{ a.texto }}</p>
  </div>
</template>
