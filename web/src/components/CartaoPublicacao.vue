<script setup lang="ts">
import { computed, ref } from 'vue'
import { textoDoErro } from '../api/client'
import type { DadosPublicacao, Publicacao } from '../api/types'
import FormPublicacao from './FormPublicacao.vue'

const props = defineProps<{
  publicacao: Publicacao
  ehMinha: boolean
  aoCurtir: (id: number) => Promise<void>
  aoEditar: (id: number, dados: DadosPublicacao) => Promise<void>
  aoExcluir: (id: number) => Promise<void>
}>()

const editando = ref(false)
const ocupado = ref(false) // curtindo ou excluindo: evita clique duplo
const erro = ref('')

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const data = computed(() => formatoData.format(new Date(props.publicacao.criadaEm)))

async function executar(acao: () => Promise<void>) {
  erro.value = ''
  ocupado.value = true
  try {
    await acao()
  } catch (e) {
    erro.value = textoDoErro(e)
  } finally {
    ocupado.value = false
  }
}

const curtir = () => executar(() => props.aoCurtir(props.publicacao.id))

function excluir() {
  if (!window.confirm('Excluir esta publicação? Não dá para desfazer.')) return
  executar(() => props.aoExcluir(props.publicacao.id))
}

async function salvarEdicao(dados: DadosPublicacao) {
  await props.aoEditar(props.publicacao.id, dados) // erro: o formulário mostra e continua aberto
  editando.value = false
}
</script>

<template>
  <article class="cartao publicacao">
    <header class="publicacao-topo">
      <RouterLink :to="`/perfil/${publicacao.autor_id}`" class="autor">@{{ publicacao.autor_nick }}</RouterLink>
      <time :datetime="publicacao.criadaEm">{{ data }}</time>
    </header>

    <FormPublicacao
      v-if="editando"
      rotulo="Salvar"
      :inicial="{ titulo: publicacao.titulo, conteudo: publicacao.conteudo }"
      :ao-salvar="salvarEdicao"
      cancelavel
      @cancelar="editando = false"
    />
    <template v-else>
      <h2 class="publicacao-titulo">{{ publicacao.titulo }}</h2>
      <p class="publicacao-conteudo">{{ publicacao.conteudo }}</p>
    </template>

    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>

    <footer v-if="!editando" class="publicacao-rodape">
      <button
        type="button"
        class="botao-curtir"
        data-testid="curtir"
        :aria-pressed="publicacao.curtiu"
        :aria-label="`Curtir, ${publicacao.curtidas} curtida${publicacao.curtidas === 1 ? '' : 's'}`"
        :disabled="ocupado"
        @click="curtir"
      >
        <span aria-hidden="true">{{ publicacao.curtiu ? '♥' : '♡' }}</span> {{ publicacao.curtidas }}
      </button>
      <span v-if="ehMinha" class="acoes">
        <button type="button" class="botao-texto" data-testid="editar" @click="editando = true">Editar</button>
        <button type="button" class="botao-texto perigo" data-testid="excluir" :disabled="ocupado" @click="excluir">
          Excluir
        </button>
      </span>
    </footer>
  </article>
</template>
