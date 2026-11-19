import { createRouter, createWebHistory, type LocationQueryValue, type Router, type RouterHistory } from 'vue-router'
import { useSessaoStore } from '../stores/sessao'
import InicioView from '../views/InicioView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** Só para quem NÃO está logado (entrar, cadastro). As demais exigem sessão. */
    soVisitante?: boolean
  }
}

/**
 * O `?redirect=` vem da URL, então qualquer um pode montar um link com ele.
 * Só aceitamos caminhos internos: "//host" e "/\host" o navegador trata como
 * outro domínio (open redirect).
 */
export function destinoSeguro(valor: LocationQueryValue | LocationQueryValue[] | undefined): string {
  if (typeof valor !== 'string') return '/'
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return '/'
  return valor
}

export function criarRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({
    history,
    routes: [
      { path: '/', name: 'inicio', component: InicioView },
      {
        path: '/entrar',
        name: 'entrar',
        component: () => import('../views/LoginView.vue'),
        meta: { soVisitante: true },
      },
      {
        path: '/cadastro',
        name: 'cadastro',
        component: () => import('../views/CadastroView.vue'),
        meta: { soVisitante: true },
      },
      {
        // (\\d+): /perfil/abc não casa e cai no redirect abaixo
        path: '/perfil/:id(\\d+)',
        name: 'perfil',
        component: () => import('../views/PerfilView.vue'),
        props: (r) => ({ id: Number(r.params.id) }),
      },
      { path: '/:qualquer(.*)*', redirect: '/' },
    ],
  })

  router.beforeEach((to) => {
    const logado = useSessaoStore().estaLogado
    if (to.meta.soVisitante && logado) return { name: 'inicio' }
    if (!to.meta.soVisitante && !logado) return { name: 'entrar', query: { redirect: to.fullPath } }
  })

  return router
}

/**
 * Chamado pelo cliente HTTP quando a API recusa o token. Navega por nome para
 * /entrar: um `push('/')` estando já em "/" é navegação duplicada, a guarda
 * não roda e a tela ficaria aberta sem sessão.
 */
export async function encerrarSessaoExpirada(router: Router) {
  useSessaoStore().sair()
  await router.push({ name: 'entrar', query: { redirect: router.currentRoute.value.fullPath } })
}

export const router = criarRouter()
