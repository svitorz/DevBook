<script setup lang="ts">
import AvisosApp from './components/AvisosApp.vue'
import CabecalhoApp from './components/CabecalhoApp.vue'
</script>

<template>
  <CabecalhoApp />
  <RouterView />
  <AvisosApp />
</template>
