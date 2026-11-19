<script setup lang="ts">
// Placeholder da B0: confirma que o front alcança a API (CORS incluso).
import { onMounted, ref } from 'vue'
import { ApiError, SEM_CONEXAO } from '../api/client'
import { publicacoesApi } from '../api/endpoints'

const status = ref('verificando…')

onMounted(async () => {
  try {
    await publicacoesApi.feed()
    status.value = 'API respondeu (sessão válida).'
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) status.value = 'API no ar (401 sem login, como esperado).'
    else if (e instanceof ApiError && e.status === SEM_CONEXAO) status.value = 'API inacessível.'
    else status.value = `Erro inesperado: ${(e as Error).message}`
  }
})
</script>

<template>
  <main class="container">
    <h1>DevBook</h1>
    <p>Fundação do front (fase B0).</p>
    <p data-testid="status-api">{{ status }}</p>
  </main>
</template>
