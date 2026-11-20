<script setup lang="ts">
// Campo de formulário (C4): rótulo ligado ao input, dica por
// aria-describedby e, para senha, o botão de mostrar/ocultar. Os demais
// atributos (name, type, autocomplete, required, maxlength...) vão direto
// para o <input>, então quem usa escreve como num input comum.
import { computed, ref, useAttrs, useId } from 'vue'
import Icone from './Icone.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ rotulo: string; dica?: string; senha?: boolean }>()
const valor = defineModel<string>({ default: '' })

const attrs = useAttrs()
const id = useId()
const idDica = useId()
const visivel = ref(false)

const tipo = computed(() => {
  if (props.senha) return visivel.value ? 'text' : 'password'
  return typeof attrs.type === 'string' ? attrs.type : 'text'
})
</script>

<template>
  <div class="campo">
    <label :for="id">{{ rotulo }}</label>
    <div class="campo-controle">
      <!-- v-bind antes: o type calculado abaixo vence o do $attrs -->
      <input
        v-bind="$attrs"
        :id="id"
        v-model="valor"
        :type="tipo"
        :aria-describedby="dica || $slots.descricao ? idDica : undefined"
        :class="{ 'com-botao': senha }"
      />
      <!-- aria-pressed com rótulo fixo: o padrão de botão liga/desliga -->
      <button
        v-if="senha"
        type="button"
        class="campo-olho"
        aria-label="Mostrar senha"
        :aria-pressed="visivel"
        :title="visivel ? 'Ocultar senha' : 'Mostrar senha'"
        @click="visivel = !visivel"
      >
        <Icone :nome="visivel ? 'olho-fechado' : 'olho'" />
      </button>
    </div>
    <div v-if="dica || $slots.descricao" :id="idDica" class="dica">{{ dica }}<slot name="descricao" /></div>
  </div>
</template>
