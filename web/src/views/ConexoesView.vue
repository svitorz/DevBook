<script setup lang="ts">
// Seguidores de um usuário ou quem ele segue.
import { computed, ref, watch } from 'vue'
import { ApiError, textoDoErro } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import ListaUsuarios from '../components/ListaUsuarios.vue'

const props = defineProps<{ id: number; tipo: 'seguidores' | 'seguindo' }>()

const dono = ref<Usuario | null>(null)
const usuarios = ref<Usuario[]>([])
const carregando = ref(true)
const erro = ref('')

const titulo = computed(() => {
  const nick = dono.value ? `@${dono.value.nick}` : ''
  return props.tipo === 'seguidores' ? `Seguidores de ${nick}` : `${nick} segue`
})

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const buscar = props.tipo === 'seguidores' ? usuariosApi.seguidores : usuariosApi.seguindo
    ;[dono.value, usuarios.value] = await Promise.all([usuariosApi.obter(props.id), buscar(props.id)])
  } catch (e) {
    erro.value = e instanceof ApiError && e.status === 404 ? 'Usuário não encontrado.' : textoDoErro(e)
  } finally {
    carregando.value = false
  }
}

watch(() => [props.id, props.tipo], carregar, { immediate: true })
</script>

<template>
  <main class="container">
    <p v-if="carregando" class="dica">Carregando…</p>
    <div v-else-if="erro" class="cartao" role="alert">
      <p class="erro">{{ erro }}</p>
      <RouterLink to="/">Voltar ao feed</RouterLink>
    </div>
    <template v-else>
      <RouterLink :to="`/perfil/${id}`" class="voltar">← perfil</RouterLink>
      <h1 class="titulo-pagina">{{ titulo }}</h1>
      <ListaUsuarios :usuarios="usuarios" vazio="Ninguém por aqui ainda." />
    </template>
  </main>
</template>
