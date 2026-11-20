<script setup lang="ts">
// Busca de usuários por nome ou nick. O termo fica na URL (?q=), então F5 e
// links compartilhados refazem a busca. Busca ao enviar, não a cada tecla:
// sem debounce e sem uma requisição por letra.
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { textoDoErro } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import ListaUsuarios from '../components/ListaUsuarios.vue'

const route = useRoute()
const router = useRouter()

const termo = ref('')
const buscado = ref('') // o que foi de fato buscado (para a mensagem de vazio)
const resultados = ref<Usuario[]>([])
const carregando = ref(false)
const erro = ref('')

function enviar() {
  const q = termo.value.trim()
  // Termo vazio: a API faria LIKE '%%' e devolveria todos os usuários.
  if (!q) return
  router.replace({ query: { q } })
}

watch(
  () => route.query.q,
  async (q) => {
    const t = typeof q === 'string' ? q.trim() : ''
    termo.value = t
    if (!t) return
    carregando.value = true
    erro.value = ''
    try {
      resultados.value = await usuariosApi.buscar(t)
      buscado.value = t
    } catch (e) {
      erro.value = textoDoErro(e)
    } finally {
      carregando.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="container">
    <h1 class="titulo-pagina">Buscar pessoas</h1>
    <form role="search" class="busca" @submit.prevent="enviar">
      <label class="visualmente-oculto" for="termo">Nome ou nick</label>
      <input id="termo" v-model="termo" type="search" placeholder="Nome ou nick" maxlength="50" />
      <button type="submit" class="botao" :disabled="carregando">Buscar</button>
    </form>
    <p v-if="carregando" class="dica">Buscando…</p>
    <p v-else-if="erro" class="erro" role="alert">{{ erro }}</p>
    <ListaUsuarios v-else-if="buscado" :usuarios="resultados" :vazio="`Ninguém encontrado para “${buscado}”.`" />
  </main>
</template>
