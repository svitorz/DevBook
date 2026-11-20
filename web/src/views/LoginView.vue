<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { textoDoErro } from '../api/client'
import CampoTexto from '../components/CampoTexto.vue'
import TelaEntrada from '../components/TelaEntrada.vue'
import { destinoSeguro } from '../router'
import { useSessaoStore } from '../stores/sessao'

const sessao = useSessaoStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const senha = ref('')
const enviando = ref(false)
const erro = ref('')

async function entrar() {
  erro.value = ''
  enviando.value = true
  try {
    await sessao.entrar(email.value.trim(), senha.value)
    await router.replace(destinoSeguro(route.query.redirect))
  } catch (e) {
    erro.value = textoDoErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaEntrada>
    <h1 class="entrada-titulo">Entrar</h1>
    <p class="entrada-subtitulo">Que bom ver você de novo.</p>
    <p v-if="route.query.conta === 'criada'" class="aviso" role="status">
      Conta criada. Entre com seu e-mail e senha.
    </p>
    <p v-else-if="route.query.conta === 'excluida'" class="aviso" role="status">Conta excluída.</p>
    <form class="cartao formulario" @submit.prevent="entrar">
      <CampoTexto v-model="email" rotulo="E-mail" name="email" type="email" autocomplete="email" required />
      <CampoTexto v-model="senha" rotulo="Senha" name="senha" senha autocomplete="current-password" required />
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button type="submit" class="botao botao-largo" :disabled="enviando">
        {{ enviando ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
    <p class="rodape-form">
      Não tem conta? <RouterLink to="/cadastro">Criar conta</RouterLink>
    </p>
  </TelaEntrada>
</template>
