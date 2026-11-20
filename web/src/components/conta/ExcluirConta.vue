<script setup lang="ts">
// Excluir é irreversível (a API apaga em cascata publicações, curtidas e
// seguidores): pedimos o nick digitado em vez de um confirm() de um clique.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { textoDoErro } from '../../api/client'
import { usuariosApi } from '../../api/endpoints'
import { useSessaoStore } from '../../stores/sessao'

const props = defineProps<{ usuarioId: number; nick: string }>()
const sessao = useSessaoStore()
const router = useRouter()

const digitado = ref('')
const excluindo = ref(false)
const erro = ref('')
const confere = computed(() => digitado.value.trim() === props.nick)

async function excluir() {
  if (!confere.value) return
  erro.value = ''
  excluindo.value = true
  try {
    await usuariosApi.deletar(props.usuarioId)
  } catch (e) {
    erro.value = textoDoErro(e)
    excluindo.value = false
    return
  }
  sessao.sair() // o token continuaria válido, mas o usuário não existe mais
  await router.replace({ name: 'entrar', query: { conta: 'excluida' } })
}
</script>

<template>
  <section class="cartao zona-perigo" data-testid="excluir-conta" aria-labelledby="titulo-excluir">
    <h2 id="titulo-excluir" class="titulo-secao">Excluir conta</h2>
    <p class="dica secao-descricao">
      Apaga sua conta, suas publicações, curtidas e conexões. Não dá para desfazer.
    </p>
    <form class="formulario" @submit.prevent="excluir">
      <label>
        <!-- span: o label é coluna flex; sem ele, cada pedaço vira uma linha -->
        <span>Digite <strong>{{ nick }}</strong> para confirmar</span>
        <input v-model="digitado" name="confirmar-nick" autocomplete="off" />
      </label>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <div class="acoes">
        <button type="submit" class="botao botao-perigo" :disabled="!confere || excluindo">
          {{ excluindo ? 'Excluindo…' : 'Excluir minha conta' }}
        </button>
      </div>
    </form>
  </section>
</template>
