<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessaoStore } from '../stores/sessao'
import { useTemaStore } from '../stores/tema'
import Icone from './Icone.vue'

const sessao = useSessaoStore()
const router = useRouter()
const tema = useTemaStore()

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
      <div class="cabecalho-direita">
        <nav v-if="sessao.estaLogado" class="nav-principal" aria-label="Principal">
          <RouterLink to="/buscar">Buscar</RouterLink>
          <RouterLink :to="`/perfil/${sessao.usuarioId}`">Meu perfil</RouterLink>
          <RouterLink to="/conta">Minha conta</RouterLink>
          <button type="button" class="botao-texto" data-testid="sair" @click="sair">Sair</button>
        </nav>
        <!-- O ícone mostra o tema para onde o clique leva. -->
        <button
          type="button"
          class="botao-icone"
          data-testid="alternar-tema"
          :aria-label="tema.atual === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'"
          :title="tema.atual === 'escuro' ? 'Tema claro' : 'Tema escuro'"
          @click="tema.alternar()"
        >
          <Icone :nome="tema.atual === 'escuro' ? 'sol' : 'lua'" />
        </button>
      </div>
    </div>
  </header>
</template>
