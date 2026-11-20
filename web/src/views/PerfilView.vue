<script setup lang="ts">
// Perfil: cabeçalho (avatar, nome, seguir) e abas Publicações / Seguidores /
// Seguindo (C3). As abas são rotas (/perfil/9, /perfil/9/seguidores...), então
// F5 e links funcionam; as duas rotas usam este componente, que é
// reaproveitado ao trocar de aba: o perfil não é buscado de novo.
import { computed, ref, watch } from 'vue'
import { ApiError, textoDoErro } from '../api/client'
import { publicacoesApi, usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import AvatarUsuario from '../components/AvatarUsuario.vue'
import CartaoPublicacao from '../components/CartaoPublicacao.vue'
import EsqueletoPublicacao from '../components/EsqueletoPublicacao.vue'
import ListaUsuarios from '../components/ListaUsuarios.vue'
import { useListaDePublicacoes } from '../composables/useListaDePublicacoes'
import { useQuemEuSigo } from '../composables/useQuemEuSigo'
import { useSessaoStore } from '../stores/sessao'

const props = defineProps<{ id: number; tipo?: 'seguidores' | 'seguindo' }>()
const sessao = useSessaoStore()

const usuario = ref<Usuario | null>(null)
const seguidores = ref<Usuario[]>([])
const seguindo = ref<Usuario[]>([])
const carregando = ref(true)
const erro = ref('')
const erroSeguir = ref('')
const alternando = ref(false)

const ehEu = computed(() => props.id === sessao.usuarioId)
// "Eu sigo este perfil?" sai da lista de seguidores dele, que já buscamos
// para a contagem (decisão da B3).
const euSigo = computed(() => seguidores.value.some((u) => u.id === sessao.usuarioId))
const membroDesde = computed(() =>
  usuario.value ? new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(usuario.value.criadoem)) : '',
)

const lista = useListaDePublicacoes(() => publicacoesApi.doUsuario(props.id))
const { pronto: seguirPronto, sigo, carregar: carregarQuemEuSigo, definir: definirSeguir } = useQuemEuSigo()
carregarQuemEuSigo()

function aba(to: string, ativa: boolean, n: number, um: string, varios: string) {
  return { to, ativa, numero: n, rotulo: n === 1 ? um : varios }
}
const abas = computed(() => [
  aba(`/perfil/${props.id}`, !props.tipo, lista.publicacoes.value.length, 'publicação', 'publicações'),
  aba(`/perfil/${props.id}/seguidores`, props.tipo === 'seguidores', seguidores.value.length, 'seguidor', 'seguidores'),
  aba(`/perfil/${props.id}/seguindo`, props.tipo === 'seguindo', seguindo.value.length, 'seguindo', 'seguindo'),
])

const conexoes = computed(() => (props.tipo === 'seguidores' ? seguidores.value : seguindo.value))
const vazioConexoes = computed(() => {
  const nick = `@${usuario.value?.nick ?? ''}`
  if (props.tipo === 'seguidores') return ehEu.value ? 'Ninguém segue você ainda.' : `Ninguém segue ${nick} ainda.`
  return ehEu.value ? 'Você ainda não segue ninguém. Que tal buscar pessoas?' : `${nick} ainda não segue ninguém.`
})

async function recarregarConexoes() {
  ;[seguidores.value, seguindo.value] = await Promise.all([
    usuariosApi.seguidores(props.id),
    usuariosApi.seguindo(props.id),
  ])
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  erroSeguir.value = ''
  try {
    ;[usuario.value] = await Promise.all([usuariosApi.obter(props.id), recarregarConexoes()])
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
    await definirSeguir(props.id, !euSigo.value)
    seguidores.value = await usuariosApi.seguidores(props.id) // contagem e estado vêm da API
  } catch (e) {
    erroSeguir.value = textoDoErro(e)
  } finally {
    alternando.value = false
  }
}

// Seguir alguém pela lista só muda as contagens deste perfil se ele for o meu.
async function definirSeguirNaLista(id: number, seguir: boolean) {
  await definirSeguir(id, seguir)
  if (ehEu.value) await recarregarConexoes()
}

// Ir de /perfil/9 para /perfil/7 reaproveita o componente: recarrega pelo id
// (trocar só a aba não muda o id e não recarrega).
watch(() => props.id, carregar, { immediate: true })
</script>

<template>
  <main class="container">
    <div v-if="carregando && !usuario" aria-busy="true">
      <p class="visualmente-oculto">Carregando perfil…</p>
      <div class="feed"><EsqueletoPublicacao v-for="n in 2" :key="n" /></div>
    </div>
    <div v-else-if="erro" class="cartao" role="alert">
      <p class="erro">{{ erro }}</p>
      <RouterLink to="/">Voltar ao feed</RouterLink>
    </div>
    <template v-else-if="usuario">
      <section class="cartao perfil" data-testid="perfil">
        <div class="perfil-topo">
          <AvatarUsuario :nick="usuario.nick" :tamanho="72" />
          <div class="perfil-identidade">
            <h1 class="perfil-nome">{{ usuario.nome }}</h1>
            <p class="dica">@{{ usuario.nick }} · membro desde {{ membroDesde }}</p>
          </div>
          <RouterLink v-if="ehEu" to="/conta" class="botao-secundario">Editar perfil</RouterLink>
          <button
            v-else
            type="button"
            :class="euSigo ? 'botao-secundario' : 'botao'"
            data-testid="seguir"
            :disabled="alternando"
            @click="alternarSeguir"
          >{{ euSigo ? 'Deixar de seguir' : 'Seguir' }}</button>
        </div>
        <p v-if="erroSeguir" class="erro" role="alert">{{ erroSeguir }}</p>
        <!-- Links, não role=tablist: cada aba é uma URL (F5 e compartilhar
             funcionam) e a navegação é Tab/Enter, como em qualquer link. -->
        <nav class="abas" aria-label="Seções do perfil">
          <RouterLink v-for="a in abas" :key="a.to" :to="a.to" :aria-current="a.ativa ? 'page' : undefined">
            <strong>{{ a.numero }}</strong> {{ a.rotulo }}
          </RouterLink>
        </nav>
      </section>

      <section v-if="!tipo" class="feed" aria-label="Publicações">
        <p v-if="lista.erro.value" class="erro" role="alert">{{ lista.erro.value }}</p>
        <p v-else-if="lista.publicacoes.value.length === 0" class="cartao vazio dica">
          {{ ehEu ? 'Você ainda não publicou. Use “Novo post” no Início.' : 'Nenhuma publicação ainda.' }}
        </p>
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

      <section v-else class="feed" :aria-label="tipo === 'seguidores' ? 'Seguidores' : 'Seguindo'">
        <ListaUsuarios
          :usuarios="conexoes"
          :vazio="vazioConexoes"
          :seguir="{ pronto: seguirPronto, sigo, definir: definirSeguirNaLista }"
        />
      </section>
    </template>
  </main>
</template>
