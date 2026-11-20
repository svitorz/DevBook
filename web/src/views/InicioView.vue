<script setup lang="ts">
// Feed: publicações do usuário logado e de quem ele segue.
import { onMounted, ref } from 'vue'
import { publicacoesApi } from '../api/endpoints'
import type { DadosPublicacao } from '../api/types'
import CartaoPublicacao from '../components/CartaoPublicacao.vue'
import EsqueletoPublicacao from '../components/EsqueletoPublicacao.vue'
import FormPublicacao from '../components/FormPublicacao.vue'
import Icone from '../components/Icone.vue'
import JanelaModal from '../components/JanelaModal.vue'
import { useListaDePublicacoes } from '../composables/useListaDePublicacoes'
import { useSessaoStore } from '../stores/sessao'

const sessao = useSessaoStore()
const { publicacoes, carregando, erro, carregar, criar, editar, excluir, alternarCurtida } =
  useListaDePublicacoes(publicacoesApi.feed)

// Pedido do usuário na C2: o formulário sai da tela e abre num modal.
const escrevendo = ref(false)

async function publicar(dados: DadosPublicacao) {
  await criar(dados) // erro: o formulário mostra e o modal continua aberto
  escrevendo.value = false
}

onMounted(carregar)
</script>

<template>
  <main class="container">
    <div class="feed-topo">
      <h1 class="titulo-pagina">Início</h1>
      <button type="button" class="botao" data-testid="novo-post" @click="escrevendo = true">
        <Icone nome="mais" />Novo post
      </button>
    </div>

    <JanelaModal :aberto="escrevendo" titulo="Novo post" @fechar="escrevendo = false">
      <FormPublicacao rotulo="Publicar" :ao-salvar="publicar" cancelavel focar-titulo @cancelar="escrevendo = false" />
    </JanelaModal>

    <section class="feed" aria-label="Feed" :aria-busy="carregando">
      <template v-if="carregando && publicacoes.length === 0">
        <p class="visualmente-oculto">Carregando publicações…</p>
        <EsqueletoPublicacao v-for="n in 3" :key="n" />
      </template>
      <div v-else-if="erro" class="cartao" role="alert">
        <p class="erro">{{ erro }}</p>
        <button type="button" class="botao" data-testid="tentar-de-novo" @click="carregar">Tentar de novo</button>
      </div>
      <div v-else-if="publicacoes.length === 0" class="cartao vazio" data-testid="vazio">
        <p>Nenhuma publicação ainda.</p>
        <p class="dica">
          Escreva a primeira em “Novo post” ou <RouterLink to="/buscar">encontre pessoas para seguir</RouterLink>.
        </p>
      </div>
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
