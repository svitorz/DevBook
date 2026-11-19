<script setup lang="ts">
import { reactive, ref } from 'vue'
import { textoDoErro } from '../../api/client'
import { usuariosApi } from '../../api/endpoints'
import type { Usuario } from '../../api/types'

const props = defineProps<{ usuario: Usuario }>()

const form = reactive({ nome: props.usuario.nome, nick: props.usuario.nick, email: props.usuario.email })
const salvando = ref(false)
const erro = ref('')
const ok = ref('')

async function salvar() {
  erro.value = ''
  ok.value = ''
  salvando.value = true
  try {
    await usuariosApi.atualizar(props.usuario.id, {
      nome: form.nome.trim(),
      nick: form.nick.trim(),
      email: form.email.trim(),
    })
    ok.value = 'Perfil atualizado.'
  } catch (e) {
    erro.value = textoDoErro(e)
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <form class="formulario" data-testid="form-perfil" @submit.prevent="salvar">
    <label>Nome <input v-model="form.nome" name="nome" autocomplete="name" maxlength="50" required /></label>
    <label>Nick <input v-model="form.nick" name="nick" autocomplete="username" maxlength="50" required /></label>
    <label>
      E-mail
      <input v-model="form.email" name="email" type="email" autocomplete="email" maxlength="50" required />
      <span class="dica">É o e-mail usado para entrar.</span>
    </label>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <p v-if="ok" class="sucesso" role="status">{{ ok }}</p>
    <div class="acoes"><button type="submit" class="botao" :disabled="salvando">Salvar perfil</button></div>
  </form>
</template>
