<script setup lang="ts">
import { computed, ref } from 'vue'
import { textoDoErro } from '../api/client'
import type { DadosPublicacao, Publicacao } from '../api/types'
import { dataCompleta, tempoRelativo } from '../utils/tempo'
import AvatarUsuario from './AvatarUsuario.vue'
import FormPublicacao from './FormPublicacao.vue'
import Icone from './Icone.vue'
import JanelaModal from './JanelaModal.vue'

const props = defineProps<{
  publicacao: Publicacao
  ehMinha: boolean
  aoCurtir: (id: number) => Promise<void>
  aoEditar: (id: number, dados: DadosPublicacao) => Promise<void>
  aoExcluir: (id: number) => Promise<void>
}>()

const editando = ref(false)
const confirmandoExclusao = ref(false)
const ocupado = ref(false) // curtindo ou excluindo: evita clique duplo
const erro = ref('')

const relativa = computed(() => tempoRelativo(props.publicacao.criadaEm))
const completa = computed(() => dataCompleta(props.publicacao.criadaEm))
const rotuloCurtidas = computed(() => {
  const n = props.publicacao.curtidas
  return `Curtir, ${n} curtida${n === 1 ? '' : 's'}`
})

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

function confirmarExclusao() {
  confirmandoExclusao.value = false
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
      <RouterLink :to="`/perfil/${publicacao.autor_id}`" class="publicacao-autor">
        <AvatarUsuario :nick="publicacao.autor_nick ?? ''" :tamanho="36" />
        <span class="autor">@{{ publicacao.autor_nick }}</span>
      </RouterLink>
      <time :datetime="publicacao.criadaEm" :title="completa">{{ relativa }}</time>
    </header>

    <FormPublicacao
      v-if="editando"
      rotulo="Salvar"
      :inicial="{ titulo: publicacao.titulo, conteudo: publicacao.conteudo }"
      :ao-salvar="salvarEdicao"
      cancelavel
      focar-titulo
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
        :aria-label="rotuloCurtidas"
        :disabled="ocupado"
        @click="curtir"
      >
        <Icone nome="coracao" :preenchido="publicacao.curtiu" />
        <span>{{ publicacao.curtidas }}</span>
      </button>
      <span v-if="ehMinha" class="publicacao-acoes">
        <button
          type="button"
          class="botao-icone"
          data-testid="editar"
          aria-label="Editar publicação"
          title="Editar"
          @click="editando = true"
        >
          <Icone nome="lapis" />
        </button>
        <button
          type="button"
          class="botao-icone perigo"
          data-testid="excluir"
          aria-label="Excluir publicação"
          title="Excluir"
          :disabled="ocupado"
          @click="confirmandoExclusao = true"
        >
          <Icone nome="lixeira" />
        </button>
      </span>
    </footer>

    <JanelaModal
      v-if="ehMinha"
      :aberto="confirmandoExclusao"
      titulo="Excluir publicação?"
      @fechar="confirmandoExclusao = false"
    >
      <p class="janela-texto">“{{ publicacao.titulo }}” será apagada, com as curtidas. Não dá para desfazer.</p>
      <div class="acoes">
        <!-- autofocus: o foco começa na opção segura -->
        <button
          type="button"
          class="botao-secundario"
          data-testid="cancelar-exclusao"
          autofocus
          @click="confirmandoExclusao = false"
        >
          Cancelar
        </button>
        <button type="button" class="botao botao-perigo" data-testid="confirmar-exclusao" @click="confirmarExclusao">
          Excluir
        </button>
      </div>
    </JanelaModal>
  </article>
</template>
