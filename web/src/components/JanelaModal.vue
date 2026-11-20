<script setup lang="ts">
// Janela modal sobre o <dialog> nativo (fase C2). O showModal() do navegador
// já dá foco preso dentro da janela, fundo inerte, Esc para fechar e foco de
// volta ao botão que abriu; aqui só sincronizamos com a prop `aberto`.
// Clicar no fundo NÃO fecha: um clique errado não pode apagar um post digitado.
import { onMounted, ref, useId, watch } from 'vue'
import Icone from './Icone.vue'

const props = defineProps<{ aberto: boolean; titulo: string }>()
const emit = defineEmits<{ fechar: [] }>()

const dialogo = ref<HTMLDialogElement | null>(null)
const idTitulo = useId()

function sincronizar(aberto: boolean) {
  const d = dialogo.value
  if (!d) return
  if (aberto && !d.open) d.showModal()
  else if (!aberto && d.open) d.close()
}

onMounted(() => sincronizar(props.aberto))
watch(() => props.aberto, sincronizar, { flush: 'post' })

// O navegador fecha o dialog sozinho no Esc; se o pai ainda o acha aberto,
// avisamos. Quando foi o próprio pai que fechou (aberto=false), não.
function aoFechar() {
  if (props.aberto) emit('fechar')
}
</script>

<template>
  <dialog ref="dialogo" class="janela" :aria-labelledby="idTitulo" @close="aoFechar">
    <header class="janela-topo">
      <h2 :id="idTitulo" class="janela-titulo">{{ titulo }}</h2>
      <button type="button" class="botao-icone" aria-label="Fechar" @click="emit('fechar')">
        <Icone nome="fechar" />
      </button>
    </header>
    <!-- v-if: o conteúdo nasce a cada abertura (formulário limpo, autofocus vale) -->
    <div v-if="aberto" class="janela-corpo"><slot /></div>
  </dialog>
</template>
