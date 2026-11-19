<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { textoDoErro } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import { useSessaoStore } from '../stores/sessao'

const sessao = useSessaoStore()
const router = useRouter()

const form = reactive({ nome: '', nick: '', email: '', senha: '' })
const enviando = ref(false)
const erro = ref('')

// As regras de senha moram na API (fonte da verdade); aqui só o básico do
// HTML (required/maxlength) e a dica. Repetir a validação em JS dobraria o
// lugar a manter quando a regra mudar.
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
  <main class="container estreito">
    <h1>Criar conta</h1>
    <form class="cartao formulario" @submit.prevent="cadastrar">
      <label>
        Nome
        <input v-model="form.nome" name="nome" autocomplete="name" maxlength="50" required />
      </label>
      <label>
        Nick
        <input v-model="form.nick" name="nick" autocomplete="username" maxlength="50" required />
      </label>
      <label>
        E-mail
        <input v-model="form.email" name="email" type="email" autocomplete="email" maxlength="50" required />
      </label>
      <label>
        Senha
        <input
          v-model="form.senha"
          name="senha"
          type="password"
          autocomplete="new-password"
          minlength="8"
          required
          aria-describedby="dica-senha"
        />
        <span id="dica-senha" class="dica">
          Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.
        </span>
      </label>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button type="submit" class="botao" :disabled="enviando">
        {{ enviando ? 'Criando…' : 'Criar conta' }}
      </button>
    </form>
    <p class="rodape-form">
      Já tem conta? <RouterLink to="/entrar">Entrar</RouterLink>
    </p>
  </main>
</template>
