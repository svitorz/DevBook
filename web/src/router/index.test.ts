import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { useSessaoStore } from '../stores/sessao'
import { criarRouter, destinoSeguro, encerrarSessaoExpirada } from './index'

function logar() {
  const sessao = useSessaoStore()
  sessao.token = 'tok'
  sessao.usuarioId = 1
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('guarda de rotas', () => {
  it('deslogado em rota privada vai para /entrar guardando o destino', async () => {
    const router = criarRouter(createMemoryHistory())
    await router.push('/?aba=1')
    expect(router.currentRoute.value.name).toBe('entrar')
    expect(router.currentRoute.value.query.redirect).toBe('/?aba=1')
  })

  it('deslogado acessa /entrar e /cadastro', async () => {
    const router = criarRouter(createMemoryHistory())
    await router.push('/cadastro')
    expect(router.currentRoute.value.name).toBe('cadastro')
    await router.push('/entrar')
    expect(router.currentRoute.value.name).toBe('entrar')
  })

  it('logado acessa a rota privada', async () => {
    logar()
    const router = criarRouter(createMemoryHistory())
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('logado em /entrar ou /cadastro volta para o início', async () => {
    logar()
    const router = criarRouter(createMemoryHistory())
    await router.push('/entrar')
    expect(router.currentRoute.value.name).toBe('inicio')
    await router.push('/cadastro')
    expect(router.currentRoute.value.name).toBe('inicio')
  })

  it('rota desconhecida cai no início (e na guarda)', async () => {
    const router = criarRouter(createMemoryHistory())
    await router.push('/nao-existe')
    expect(router.currentRoute.value.name).toBe('entrar')
  })
})

describe('destinoSeguro', () => {
  it.each([
    ['/perfil/3', '/perfil/3'],
    [undefined, '/'],
    [['/a', '/b'], '/'],
    ['https://malicioso.example', '/'],
    ['//malicioso.example', '/'],
    ['/\\malicioso.example', '/'],
  ])('%j → %s', (entrada, esperado) => {
    expect(destinoSeguro(entrada as never)).toBe(esperado)
  })
})

describe('sessão expirada', () => {
  it('sai da sessão e vai para /entrar mesmo já estando no início', async () => {
    logar()
    const router = criarRouter(createMemoryHistory())
    await router.push('/')

    await encerrarSessaoExpirada(router)

    expect(useSessaoStore().estaLogado).toBe(false)
    expect(router.currentRoute.value.name).toBe('entrar')
    expect(router.currentRoute.value.query.redirect).toBe('/')
  })
})

describe('rolagem ao navegar', () => {
  const rolagem = () => criarRouter(createMemoryHistory()).options.scrollBehavior!
  const rota = (path: string) => ({ path, hash: '' }) as never

  it('página nova começa no topo (antes ficava na altura da página anterior)', async () => {
    expect(await rolagem()(rota('/perfil/2'), rota('/'), null)).toEqual({ top: 0 })
  })

  it('voltar/avançar restaura onde a pessoa estava', async () => {
    expect(await rolagem()(rota('/'), rota('/perfil/2'), { left: 0, top: 640 })).toEqual({ left: 0, top: 640 })
  })

  it('trocar de aba no mesmo perfil não pula para o topo', async () => {
    expect(await rolagem()(rota('/perfil/2/seguidores'), rota('/perfil/2'), null)).toBe(false)
  })
})
