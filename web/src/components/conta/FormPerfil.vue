<script setup lang="ts">
import { reactive, ref } from 'vue'
import { textoDoErro } from '../../api/client'
import { usuariosApi } from '../../api/endpoints'
import type { Usuario } from '../../api/types'
import { useSessaoStore } from '../../stores/sessao'
import CampoTexto from '../CampoTexto.vue'

const props = defineProps<{ usuario: Usuario }>()

const form = reactive({ nome: props.usuario.nome, nick: props.usuario.nick, email: props.usuario.email })
const salvando = ref(false)
const erro = ref('')
const ok = ref('')
const sessao = useSessaoStore()

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
    await sessao.carregarUsuario() // o menu do cabeçalho mostra o nome novo (vindo da API)
  } catch (e) {
    erro.value = textoDoErro(e)
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <form class="formulario" data-testid="form-perfil" @submit.prevent="salvar">
    <CampoTexto v-model="form.nome" rotulo="Nome" name="nome" autocomplete="name" maxlength="50" required />
    <CampoTexto
      v-model="form.nick"
      rotulo="Nick"
      dica="Também define as iniciais e a cor do seu avatar."
      name="nick"
      autocomplete="username"
      maxlength="50"
      required
    />
    <CampoTexto
      v-model="form.email"
      rotulo="E-mail"
      dica="É o e-mail usado para entrar. Não aparece no seu perfil."
      name="email"
      type="email"
      autocomplete="email"
      maxlength="50"
      required
    />
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <p v-if="ok" class="sucesso" role="status">{{ ok }}</p>
    <div class="acoes"><button type="submit" class="botao" :disabled="salvando">Salvar perfil</button></div>
  </form>
</template>
