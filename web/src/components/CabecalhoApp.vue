<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessaoStore } from '../stores/sessao'
import { useTemaStore } from '../stores/tema'
import AvatarUsuario from './AvatarUsuario.vue'
import Icone from './Icone.vue'
import LogoDevBook from './LogoDevBook.vue'

const sessao = useSessaoStore()
const tema = useTemaStore()
const route = useRoute()
const router = useRouter()

// Nome/nick do avatar: busca ao entrar (ou ao abrir o app já logado).
watch(
  () => sessao.estaLogado,
  (logado) => {
    if (logado && !sessao.usuario) sessao.carregarUsuario()
  },
  { immediate: true },
)

// "Perfil" fica ativo no meu perfil e nas minhas listas de seguidores/seguindo
// (rotas diferentes; o RouterLink só marcaria a exata).
const perfilAtivo = computed(
  () => (route.name === 'perfil' || route.name === 'conexoes') && Number(route.params.id) === sessao.usuarioId,
)

// ---------- menu da conta ----------
// Padrão "disclosure" (botão com aria-expanded + painel de links), não role=menu:
// role=menu exige navegação por setas; aqui Tab e Esc bastam.
const menuAberto = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const botaoMenu = ref<HTMLButtonElement | null>(null)

function fecharMenu(devolverFoco = false) {
  menuAberto.value = false
  if (devolverFoco) nextTick(() => botaoMenu.value?.focus())
}

function aoClicarFora(e: Event) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) fecharMenu()
}

watch(menuAberto, (aberto) => {
  if (aberto) document.addEventListener('pointerdown', aoClicarFora)
  else document.removeEventListener('pointerdown', aoClicarFora)
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', aoClicarFora))
watch(() => route.fullPath, () => fecharMenu())

// O JWT é stateless: a API não tem logout. Sair = esquecer o token aqui.
// (Um token copiado antes continua válido até expirar, em 6h.)
async function sair() {
  fecharMenu()
  sessao.sair()
  await router.push({ name: 'entrar' })
}
</script>

<template>
  <header class="cabecalho">
    <div class="container cabecalho-conteudo">
      <RouterLink to="/" class="marca"><LogoDevBook />DevBook</RouterLink>

      <!-- No celular, esta mesma nav vira a barra de abas fixa no rodapé (CSS). -->
      <nav v-if="sessao.estaLogado" class="nav-principal" aria-label="Principal">
        <RouterLink to="/"><Icone nome="casa" :tamanho="20" /><span>Início</span></RouterLink>
        <RouterLink to="/buscar"><Icone nome="busca" :tamanho="20" /><span>Buscar</span></RouterLink>
        <RouterLink :to="`/perfil/${sessao.usuarioId}`" :aria-current="perfilAtivo ? 'page' : undefined">
          <Icone nome="usuario" :tamanho="20" /><span>Perfil</span>
        </RouterLink>
      </nav>

      <div class="cabecalho-direita">
        <!-- O ícone mostra o tema para onde o clique leva. -->
        <button
          type="button"
          class="botao-icone"
          data-testid="alternar-tema"
          :aria-label="tema.atual === 'escuro' ? 'Ativar tema claro' : 'Ativar tema escuro'"
          :title="tema.atual === 'escuro' ? 'Tema claro' : 'Tema escuro'"
          @click="tema.alternar()"
        >
          <Icone :nome="tema.atual === 'escuro' ? 'sol' : 'lua'" />
        </button>

        <div v-if="sessao.estaLogado" ref="menuRef" class="menu-conta" @keydown.esc="fecharMenu(true)">
          <button
            ref="botaoMenu"
            type="button"
            class="botao-avatar"
            data-testid="menu-conta"
            aria-label="Menu da conta"
            aria-controls="menu-conta"
            :aria-expanded="menuAberto"
            @click="menuAberto = !menuAberto"
          >
            <AvatarUsuario :nome="sessao.usuario?.nome ?? ''" :semente="sessao.usuario?.nick ?? ''" />
          </button>

          <div v-if="menuAberto" id="menu-conta" class="menu-conta-painel">
            <div v-if="sessao.usuario" class="menu-conta-quem">
              <strong>{{ sessao.usuario.nome }}</strong>
              <span>@{{ sessao.usuario.nick }}</span>
            </div>
            <RouterLink to="/conta" class="menu-conta-item"><Icone nome="ajustes" /><span>Minha conta</span></RouterLink>
            <button type="button" class="menu-conta-item" data-testid="sair" @click="sair">
              <Icone nome="sair" /><span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
