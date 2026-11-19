<script setup lang="ts">
// Feed: publicações do usuário logado e de quem ele segue.
import { onMounted } from 'vue'
import { publicacoesApi } from '../api/endpoints'
import CartaoPublicacao from '../components/CartaoPublicacao.vue'
import FormPublicacao from '../components/FormPublicacao.vue'
import { useListaDePublicacoes } from '../composables/useListaDePublicacoes'
import { useSessaoStore } from '../stores/sessao'

const sessao = useSessaoStore()
const { publicacoes, carregando, erro, carregar, criar, editar, excluir, alternarCurtida } =
  useListaDePublicacoes(publicacoesApi.feed)

onMounted(carregar)
</script>

<template>
  <main class="container">
    <section class="cartao" aria-labelledby="titulo-nova">
      <h1 id="titulo-nova" class="titulo-secao">Nova publicação</h1>
      <FormPublicacao rotulo="Publicar" :ao-salvar="criar" limpar-ao-salvar />
    </section>

    <section class="feed" aria-label="Feed" :aria-busy="carregando">
      <p v-if="carregando && publicacoes.length === 0" class="dica">Carregando…</p>
      <div v-else-if="erro" class="cartao" role="alert">
        <p class="erro">{{ erro }}</p>
        <button type="button" class="botao" data-testid="tentar-de-novo" @click="carregar">Tentar de novo</button>
      </div>
      <p v-else-if="publicacoes.length === 0" class="dica" data-testid="vazio">
        Nenhuma publicação ainda. Escreva a primeira ou siga alguém.
      </p>
      <CartaoPublicacao
        v-for="p in publicacoes"
        :key="p.id"
        :publicacao="p"
        :eh-minha="p.autor_id === sessao.usuarioId"
        :ao-curtir="alternarCurtida"
        :ao-editar="editar"
        :ao-excluir="excluir"
      />
    </section>
  </main>
</template>
