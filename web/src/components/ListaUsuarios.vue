<script setup lang="ts">
// Lista de usuários com link para o perfil (busca, seguidores e seguindo).
// O e-mail que a API devolve não é exibido.
import type { Usuario } from '../api/types'

defineProps<{ usuarios: Usuario[]; vazio: string }>()
</script>

<template>
  <p v-if="usuarios.length === 0" class="dica">{{ vazio }}</p>
  <ul v-else class="lista-usuarios">
    <li v-for="u in usuarios" :key="u.id">
      <RouterLink :to="`/perfil/${u.id}`" class="cartao item-usuario">
        <strong>{{ u.nome }}</strong>
        <span class="dica">@{{ u.nick }}</span>
      </RouterLink>
    </li>
  </ul>
</template>
