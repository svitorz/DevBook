<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessaoStore } from '../stores/sessao'

const sessao = useSessaoStore()
const router = useRouter()

// O JWT é stateless: a API não tem logout. Sair = esquecer o token aqui.
// (Um token copiado antes continua válido até expirar, em 6h.)
async function sair() {
  sessao.sair()
  await router.push({ name: 'entrar' })
}
</script>

<template>
  <header class="cabecalho">
    <div class="container cabecalho-conteudo">
      <RouterLink to="/" class="marca">DevBook</RouterLink>
      <nav v-if="sessao.estaLogado" class="nav-principal" aria-label="Principal">
        <RouterLink to="/buscar">Buscar</RouterLink>
        <RouterLink :to="`/perfil/${sessao.usuarioId}`">Meu perfil</RouterLink>
        <RouterLink to="/conta">Minha conta</RouterLink>
        <button type="button" class="botao-texto" data-testid="sair" @click="sair">Sair</button>
      </nav>
    </div>
  </header>
</template>
