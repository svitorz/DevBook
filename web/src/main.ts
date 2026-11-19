import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { configurarCliente } from './api/client'
import { encerrarSessaoExpirada, router } from './router'
import { useSessaoStore } from './stores/sessao'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// O cliente HTTP lê o token da sessão e, se a API recusar o token
// (expirado/inválido), encerra a sessão e manda para /entrar.
const sessao = useSessaoStore()
configurarCliente({
  token: () => sessao.token,
  aoExpirarSessao: () => encerrarSessaoExpirada(router),
})

app.mount('#app')
