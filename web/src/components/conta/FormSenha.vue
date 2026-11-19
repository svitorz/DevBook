<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ApiError, textoDoErro } from '../../api/client'
import { usuariosApi } from '../../api/endpoints'

const props = defineProps<{ usuarioId: number }>()

const form = reactive({ atual: '', nova: '', confirmar: '' })
const salvando = ref(false)
const erro = ref('')
const ok = ref('')

async function trocar() {
  erro.value = ''
  ok.value = ''
  // Única regra checada aqui: é só da tela (a API nem recebe a confirmação).
  if (form.nova !== form.confirmar) {
    erro.value = 'A confirmação não confere com a nova senha.'
    return
  }
  salvando.value = true
  try {
    await usuariosApi.atualizarSenha(props.usuarioId, form.atual, form.nova)
    form.atual = form.nova = form.confirmar = ''
    ok.value = 'Senha alterada.'
  } catch (e) {
    // O 401 daqui traz a mensagem crua do bcrypt; o usuário só precisa disto:
    erro.value = e instanceof ApiError && e.status === 401 ? 'Senha atual incorreta.' : textoDoErro(e)
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <form class="formulario" data-testid="form-senha" @submit.prevent="trocar">
    <label>
      Senha atual
      <input v-model="form.atual" name="atual" type="password" autocomplete="current-password" required />
    </label>
    <label>
      Nova senha
      <input
        v-model="form.nova"
        name="nova"
        type="password"
        autocomplete="new-password"
        minlength="8"
        required
        aria-describedby="dica-nova-senha"
      />
      <span id="dica-nova-senha" class="dica">
        Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial.
      </span>
    </label>
    <label>
      Confirmar nova senha
      <input v-model="form.confirmar" name="confirmar" type="password" autocomplete="new-password" required />
    </label>
    <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    <p v-if="ok" class="sucesso" role="status">{{ ok }}</p>
    <div class="acoes"><button type="submit" class="botao" :disabled="salvando">Trocar senha</button></div>
  </form>
</template>
