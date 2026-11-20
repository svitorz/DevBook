<template>
  <!-- Forma de um cartão enquanto o conteúdo chega. Decorativo: quem usa
       anuncia "carregando" em texto para leitores de tela. -->
  <div class="cartao publicacao esqueleto" data-testid="esqueleto" aria-hidden="true">
    <div class="esqueleto-linha-topo">
      <span class="esqueleto-bloco esqueleto-avatar" />
      <span class="esqueleto-bloco" style="width: 30%" />
    </div>
    <span class="esqueleto-bloco" style="width: 55%; height: 18px" />
    <span class="esqueleto-bloco" style="width: 90%" />
    <span class="esqueleto-bloco" style="width: 70%" />
  </div>
</template>
