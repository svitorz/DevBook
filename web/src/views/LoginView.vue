<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { textoDoErro } from '../api/client'
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
  <main class="container estreito">
    <h1>Entrar</h1>
    <p v-if="route.query.conta === 'criada'" class="aviso" role="status">
      Conta criada. Entre com seu e-mail e senha.
    </p>
    <form class="cartao formulario" @submit.prevent="entrar">
      <label>
        E-mail
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <label>
        Senha
        <input v-model="senha" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button type="submit" class="botao" :disabled="enviando">
        {{ enviando ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
    <p class="rodape-form">
      Não tem conta? <RouterLink to="/cadastro">Criar conta</RouterLink>
    </p>
  </main>
</template>
