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
      <nav v-if="sessao.estaLogado" aria-label="Conta">
        <button type="button" class="botao-texto" data-testid="sair" @click="sair">Sair</button>
      </nav>
    </div>
  </header>
</template>
