<script setup lang="ts">
// Moldura das telas de entrar e criar conta (C4): à esquerda, o que é o
// DevBook; à direita, o formulário (slot). No celular, a apresentação encolhe
// para uma linha acima do formulário.
import Icone from './Icone.vue'
import LogoDevBook from './LogoDevBook.vue'
</script>

<template>
  <main class="tela-entrada">
    <section class="apresentacao" data-testid="apresentacao" aria-label="Sobre o DevBook">
      <LogoDevBook :tamanho="44" class="apresentacao-logo" />
      <p class="apresentacao-titulo">O DevBook é o lugar para devs compartilharem o que estão construindo.</p>
      <ul class="apresentacao-lista">
        <li><Icone nome="lapis" />Publique ideias, descobertas e dúvidas.</li>
        <li><Icone nome="usuario" />Siga outros devs e acompanhe o que eles postam.</li>
        <li><Icone nome="coracao" />Curta o que valeu a leitura.</li>
      </ul>
    </section>
    <div class="entrada-form"><slot /></div>
  </main>
</template>
