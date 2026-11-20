<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { textoDoErro } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import CampoTexto from '../components/CampoTexto.vue'
import RegrasSenha from '../components/RegrasSenha.vue'
import TelaEntrada from '../components/TelaEntrada.vue'
import { useSessaoStore } from '../stores/sessao'

const sessao = useSessaoStore()
const router = useRouter()

const form = reactive({ nome: '', nick: '', email: '', senha: '' })
const enviando = ref(false)
const erro = ref('')

// As regras da senha aparecem marcadas enquanto a pessoa digita (C4), mas não
// bloqueiam o envio: a API continua sendo a fonte da verdade e a mensagem
// dela aparece se algo escapar.
async function cadastrar() {
  erro.value = ''
  enviando.value = true
  const dados = {
    nome: form.nome.trim(),
    nick: form.nick.trim(),
    email: form.email.trim(),
    senha: form.senha,
  }
  try {
    await usuariosApi.cadastrar(dados)
  } catch (e) {
    erro.value = textoDoErro(e)
    enviando.value = false
    return
  }
  try {
    await sessao.entrar(dados.email, dados.senha)
    await router.replace({ name: 'inicio' })
  } catch {
    // A conta existe; só o login automático falhou. Reenviar o cadastro daria 409.
    await router.replace({ name: 'entrar', query: { conta: 'criada' } })
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaEntrada>
    <h1 class="entrada-titulo">Criar conta</h1>
    <p class="entrada-subtitulo">Leva menos de um minuto.</p>
    <form class="cartao formulario" @submit.prevent="cadastrar">
      <CampoTexto v-model="form.nome" rotulo="Nome" name="nome" autocomplete="name" maxlength="50" required />
      <CampoTexto
        v-model="form.nick"
        rotulo="Nick"
        dica="É como as pessoas vão te encontrar: @nick."
        name="nick"
        autocomplete="username"
        maxlength="50"
        required
      />
      <CampoTexto
        v-model="form.email"
        rotulo="E-mail"
        name="email"
        type="email"
        autocomplete="email"
        maxlength="50"
        required
      />
      <CampoTexto v-model="form.senha" rotulo="Senha" name="senha" senha autocomplete="new-password" minlength="8" required>
        <template #descricao><RegrasSenha :senha="form.senha" /></template>
      </CampoTexto>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button type="submit" class="botao botao-largo" :disabled="enviando">
        {{ enviando ? 'Criando…' : 'Criar conta' }}
      </button>
    </form>
    <p class="rodape-form">
      Já tem conta? <RouterLink to="/entrar">Entrar</RouterLink>
    </p>
  </TelaEntrada>
</template>
