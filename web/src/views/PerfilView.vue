<script setup lang="ts">
// Perfil: dados do usuário, contagens, seguir/deixar de seguir e publicações.
import { computed, ref, watch } from 'vue'
import { ApiError, textoDoErro } from '../api/client'
import { publicacoesApi, usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import CartaoPublicacao from '../components/CartaoPublicacao.vue'
import { useListaDePublicacoes } from '../composables/useListaDePublicacoes'
import { useSessaoStore } from '../stores/sessao'

const props = defineProps<{ id: number }>()
const sessao = useSessaoStore()

const usuario = ref<Usuario | null>(null)
const seguidores = ref<Usuario[]>([])
const seguindo = ref<Usuario[]>([])
const carregando = ref(true)
const erro = ref('')
const erroSeguir = ref('')
const alternando = ref(false)

const ehEu = computed(() => props.id === sessao.usuarioId)
// A API não tem "eu sigo este perfil?": a resposta está na lista de seguidores,
// que já buscamos para a contagem.
const euSigo = computed(() => seguidores.value.some((u) => u.id === sessao.usuarioId))
const membroDesde = computed(() =>
  usuario.value ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(usuario.value.criadoem)) : '',
)

const lista = useListaDePublicacoes(() => publicacoesApi.doUsuario(props.id))

async function carregar() {
  carregando.value = true
  erro.value = ''
  erroSeguir.value = ''
  try {
    ;[usuario.value, seguidores.value, seguindo.value] = await Promise.all([
      usuariosApi.obter(props.id),
      usuariosApi.seguidores(props.id),
      usuariosApi.seguindo(props.id),
    ])
    await lista.carregar()
  } catch (e) {
    usuario.value = null
    erro.value = e instanceof ApiError && e.status === 404 ? 'Usuário não encontrado.' : textoDoErro(e)
  } finally {
    carregando.value = false
  }
}

async function alternarSeguir() {
  erroSeguir.value = ''
  alternando.value = true
  try {
    if (euSigo.value) await usuariosApi.pararDeSeguir(props.id)
    else await usuariosApi.seguir(props.id)
    seguidores.value = await usuariosApi.seguidores(props.id) // contagem e estado vêm da API
  } catch (e) {
    erroSeguir.value = textoDoErro(e)
  } finally {
    alternando.value = false
  }
}

// Ir de /perfil/9 para /perfil/7 reaproveita o componente: recarrega pelo id.
watch(() => props.id, carregar, { immediate: true })
</script>

<template>
  <main class="container">
    <p v-if="carregando && !usuario" class="dica">Carregando…</p>
    <div v-else-if="erro" class="cartao" role="alert">
      <p class="erro">{{ erro }}</p>
      <RouterLink to="/">Voltar ao feed</RouterLink>
    </div>
    <template v-else-if="usuario">
      <section class="cartao perfil" data-testid="perfil">
        <div class="perfil-topo">
          <div>
            <h1 class="perfil-nome">{{ usuario.nome }}</h1>
            <p class="dica">@{{ usuario.nick }} · membro desde {{ membroDesde }}</p>
          </div>
          <button
            v-if="!ehEu"
            type="button"
            :class="euSigo ? 'botao-secundario' : 'botao'"
            data-testid="seguir"
            :disabled="alternando"
            @click="alternarSeguir"
          >{{ euSigo ? 'Deixar de seguir' : 'Seguir' }}</button>
        </div>
        <nav class="perfil-contagens" aria-label="Conexões">
          <RouterLink :to="`/perfil/${usuario.id}/seguidores`"><strong>{{ seguidores.length }}</strong> seguidores</RouterLink>
          <RouterLink :to="`/perfil/${usuario.id}/seguindo`"><strong>{{ seguindo.length }}</strong> seguindo</RouterLink>
        </nav>
        <p v-if="erroSeguir" class="erro" role="alert">{{ erroSeguir }}</p>
      </section>

      <section class="feed" aria-label="Publicações">
        <p v-if="lista.erro.value" class="erro" role="alert">{{ lista.erro.value }}</p>
        <p v-else-if="lista.publicacoes.value.length === 0" class="dica">Nenhuma publicação ainda.</p>
        <CartaoPublicacao
          v-for="p in lista.publicacoes.value"
          :key="p.id"
          :publicacao="p"
          :eh-minha="p.autor_id === sessao.usuarioId"
          :ao-curtir="lista.alternarCurtida"
          :ao-editar="lista.editar"
          :ao-excluir="lista.excluir"
        />
      </section>
    </template>
  </main>
</template>
