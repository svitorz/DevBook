<script setup lang="ts">
// Uma pessoa numa lista: avatar, nome e @nick com link para o perfil e,
// opcionalmente, o botão Seguir. O botão fica fora do link (botão dentro de
// link é HTML inválido e confunde leitores de tela).
import { ref } from 'vue'
import { textoDoErro } from '../api/client'
import type { Usuario } from '../api/types'
import AvatarUsuario from './AvatarUsuario.vue'

const props = defineProps<{
  usuario: Usuario
  /** undefined: sem botão (eu mesmo, ou estado de "sigo?" desconhecido) */
  sigo?: boolean
  aoDefinirSeguir?: (id: number, seguir: boolean) => Promise<void>
}>()

const ocupado = ref(false)
const erro = ref('')

async function alternar() {
  if (!props.aoDefinirSeguir || props.sigo === undefined) return
  erro.value = ''
  ocupado.value = true
  try {
    await props.aoDefinirSeguir(props.usuario.id, !props.sigo)
  } catch (e) {
    erro.value = textoDoErro(e)
  } finally {
    ocupado.value = false
  }
}
</script>

<template>
  <li class="cartao item-usuario">
    <RouterLink :to="`/perfil/${usuario.id}`" class="item-usuario-link">
      <AvatarUsuario :nick="usuario.nick" :tamanho="40" />
      <span class="item-usuario-nomes">
        <strong>{{ usuario.nome }}</strong>
        <span class="dica">@{{ usuario.nick }}</span>
      </span>
    </RouterLink>
    <button
      v-if="sigo !== undefined"
      type="button"
      :class="sigo ? 'botao-secundario' : 'botao'"
      :data-testid="`seguir-${usuario.id}`"
      :aria-label="`${sigo ? 'Deixar de seguir' : 'Seguir'} @${usuario.nick}`"
      :disabled="ocupado"
      @click="alternar"
    >
      {{ sigo ? 'Deixar de seguir' : 'Seguir' }}
    </button>
    <p v-if="erro" class="erro item-usuario-erro" role="alert">{{ erro }}</p>
  </li>
</template>
