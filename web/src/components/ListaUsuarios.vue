<script setup lang="ts">
// Lista de usuários (busca e abas do perfil). O e-mail que a API devolve
// não é exibido. Com `seguir`, cada pessoa (menos eu) ganha o botão Seguir.
import type { Usuario } from '../api/types'
import { useSessaoStore } from '../stores/sessao'
import ItemUsuario from './ItemUsuario.vue'

defineProps<{
  usuarios: Usuario[]
  vazio: string
  seguir?: { pronto: boolean; sigo: (id: number) => boolean; definir: (id: number, seguir: boolean) => Promise<void> }
}>()

const sessao = useSessaoStore()
</script>

<template>
  <p v-if="usuarios.length === 0" class="cartao vazio dica">{{ vazio }}</p>
  <ul v-else class="lista-usuarios">
    <ItemUsuario
      v-for="u in usuarios"
      :key="u.id"
      :usuario="u"
      :sigo="seguir?.pronto && u.id !== sessao.usuarioId ? seguir.sigo(u.id) : undefined"
      :ao-definir-seguir="seguir?.definir"
    />
  </ul>
</template>
