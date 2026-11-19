import { createRouter, createWebHistory } from 'vue-router'
import InicioView from '../views/InicioView.vue'

// B0: só a rota inicial. Cadastro, login e a guarda de rotas entram na B1.
export const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'inicio', component: InicioView }],
})
