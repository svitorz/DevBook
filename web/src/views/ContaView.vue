<script setup lang="ts">
// Minha conta: editar perfil, trocar senha e excluir conta.
import { onMounted, ref } from 'vue'
import { textoDoErro } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import ExcluirConta from '../components/conta/ExcluirConta.vue'
import FormPerfil from '../components/conta/FormPerfil.vue'
import FormSenha from '../components/conta/FormSenha.vue'
import { useSessaoStore } from '../stores/sessao'

const sessao = useSessaoStore()
const usuario = ref<Usuario | null>(null)
const erro = ref('')

onMounted(async () => {
  try {
    usuario.value = await usuariosApi.obter(sessao.usuarioId!) // rota privada: há sessão
  } catch (e) {
    erro.value = textoDoErro(e)
  }
})
</script>

<template>
  <main class="container conta">
    <h1 class="titulo-pagina">Minha conta</h1>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <p v-else-if="!usuario" class="dica">Carregando…</p>
    <template v-else>
      <section class="cartao" aria-labelledby="titulo-perfil">
        <h2 id="titulo-perfil" class="titulo-secao">Perfil</h2>
        <FormPerfil :usuario="usuario" />
      </section>
      <section class="cartao" aria-labelledby="titulo-senha">
        <h2 id="titulo-senha" class="titulo-secao">Senha</h2>
        <FormSenha :usuario-id="usuario.id" />
      </section>
      <ExcluirConta :usuario-id="usuario.id" :nick="usuario.nick" />
    </template>
  </main>
</template>
