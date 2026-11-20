<script setup lang="ts">
// Formulário de publicação, usado para criar (modal "Novo post") e editar (no cartão).
// Recebe a ação como função assíncrona para mostrar o erro dela aqui mesmo.
import { computed, onMounted, reactive, ref } from 'vue'
import { textoDoErro } from '../api/client'
import type { DadosPublicacao } from '../api/types'

const LIMITE_TITULO = 50 // mesmos limites validados pela API
const LIMITE_CONTEUDO = 300

const props = defineProps<{
  rotulo: string
  aoSalvar: (dados: DadosPublicacao) => Promise<void>
  inicial?: DadosPublicacao
  cancelavel?: boolean
  /** Põe o cursor no título ao montar (ex.: ao abrir a edição no cartão). */
  focarTitulo?: boolean
}>()
const emit = defineEmits<{ cancelar: [] }>()

const form = reactive({ titulo: props.inicial?.titulo ?? '', conteudo: props.inicial?.conteudo ?? '' })
const salvando = ref(false)
const erro = ref('')
const restantes = computed(() => LIMITE_CONTEUDO - form.conteudo.length)
const campoTitulo = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (props.focarTitulo) campoTitulo.value?.focus()
})

async function salvar() {
  erro.value = ''
  salvando.value = true
  try {
    await props.aoSalvar({ titulo: form.titulo.trim(), conteudo: form.conteudo.trim() })
  } catch (e) {
    erro.value = textoDoErro(e)
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <form class="formulario" @submit.prevent="salvar">
    <label>
      Título
      <input ref="campoTitulo" v-model="form.titulo" name="titulo" :maxlength="LIMITE_TITULO" required />
    </label>
    <label>
      Conteúdo
      <textarea v-model="form.conteudo" name="conteudo" rows="5" :maxlength="LIMITE_CONTEUDO" required />
      <span class="dica" data-testid="restantes">{{ restantes }} caracteres restantes</span>
    </label>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <div class="acoes">
      <button v-if="cancelavel" type="button" class="botao-texto" data-testid="cancelar" @click="emit('cancelar')">
        Cancelar
      </button>
      <button type="submit" class="botao" :disabled="salvando">{{ salvando ? 'Salvando…' : rotulo }}</button>
    </div>
  </form>
</template>
