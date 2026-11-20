<script setup lang="ts">
// Busca de usuários por nome ou nick. Busca enquanto a pessoa digita, 300 ms
// depois da última tecla (C3), e Enter busca na hora. O termo fica na URL
// (?q=), então F5 e links compartilhados refazem a busca; a URL muda com
// replace, para cada letra não virar um passo do "voltar".
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { textoDoErro } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import Icone from '../components/Icone.vue'
import ListaUsuarios from '../components/ListaUsuarios.vue'
import { useQuemEuSigo } from '../composables/useQuemEuSigo'

const ESPERA_MS = 300

const route = useRoute()
const router = useRouter()

const termo = ref('')
const campo = ref<HTMLInputElement | null>(null)
// Quem abre a busca vai digitar. (O atributo autofocus só vale na primeira
// carga da página, não ao navegar dentro do SPA.)
onMounted(() => campo.value?.focus())
const buscado = ref('') // o que foi de fato buscado (para a mensagem de vazio)
const resultados = ref<Usuario[]>([])
const carregando = ref(false)
const erro = ref('')

const { pronto: seguirPronto, sigo, carregar: carregarQuemEuSigo, definir: definirSeguir } = useQuemEuSigo()
carregarQuemEuSigo()

const termoDaUrl = () => (typeof route.query.q === 'string' ? route.query.q.trim() : '')

// Termo vazio sai da URL: a API faria LIKE '%%' e devolveria todo mundo.
function irPara(q: string) {
  if (q !== termoDaUrl()) router.replace({ query: q ? { q } : {} })
}

let espera: ReturnType<typeof setTimeout> | undefined
watch(termo, (t) => {
  clearTimeout(espera)
  espera = setTimeout(() => irPara(t.trim()), ESPERA_MS)
})
onBeforeUnmount(() => clearTimeout(espera))

function enviar() {
  clearTimeout(espera)
  irPara(termo.value.trim())
}

// Cada busca ganha um número; só a mais recente pode escrever na tela.
// Sem isso, a resposta lenta de "a" chegaria depois da de "ab" e venceria.
let ultima = 0
watch(
  () => route.query.q,
  async () => {
    const t = termoDaUrl()
    if (termo.value.trim() !== t) termo.value = t // F5 / link: o campo mostra o termo
    const minha = ++ultima
    erro.value = ''
    if (!t) {
      resultados.value = []
      buscado.value = ''
      carregando.value = false
      return
    }
    carregando.value = true
    try {
      const r = await usuariosApi.buscar(t)
      if (minha !== ultima) return
      resultados.value = r
      buscado.value = t
    } catch (e) {
      if (minha === ultima) erro.value = textoDoErro(e)
    } finally {
      if (minha === ultima) carregando.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="container">
    <h1 class="titulo-pagina">Buscar pessoas</h1>
    <form role="search" class="busca" @submit.prevent="enviar">
      <label class="visualmente-oculto" for="termo">Nome ou nick</label>
      <Icone nome="busca" class="busca-icone" />
      <input
        id="termo"
        ref="campo"
        v-model="termo"
        type="search"
        placeholder="Nome ou nick"
        maxlength="50"
        autocomplete="off"
      />
    </form>
    <p class="dica busca-status" aria-live="polite">{{ carregando ? 'Buscando…' : '' }}</p>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <!-- Os resultados anteriores ficam enquanto a próxima busca chega: a lista
         não pisca a cada tecla. -->
    <ListaUsuarios
      v-else-if="buscado"
      :usuarios="resultados"
      :vazio="`Ninguém encontrado para “${buscado}”.`"
      :seguir="{ pronto: seguirPronto, sigo, definir: definirSeguir }"
    />
    <p v-else-if="!carregando" class="cartao vazio dica">Digite um nome ou nick para encontrar pessoas.</p>
  </main>
</template>
