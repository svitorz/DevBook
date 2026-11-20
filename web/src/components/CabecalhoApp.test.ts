import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'
import CabecalhoApp from './CabecalhoApp.vue'

const EU: Usuario = { id: 1, nome: 'Ana Lima', nick: 'ana', email: 'ana@x.test', criadoem: '2026-01-15T12:00:00Z' }

async function montar(url = '/') {
  const router = criarRouter(createMemoryHistory())
  await router.push(url)
  const wrapper = mount(CabecalhoApp, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

function logar() {
  localStorage.setItem('devbook.sessao', JSON.stringify({ id: EU.id, token: 'tok' }))
}

let montado: { unmount(): void } | null = null

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
  vi.spyOn(usuariosApi, 'obter').mockResolvedValue({ ...EU })
})

afterEach(() => {
  montado?.unmount()
  montado = null
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.tema
})

async function montarLogado(url = '/') {
  logar()
  const r = await montar(url)
  montado = r.wrapper
  return r
}

const nav = 'nav[aria-label=Principal]'

describe('CabecalhoApp deslogado', () => {
  it('só a marca e o tema: sem navegação nem menu da conta', async () => {
    const { wrapper } = await montar('/entrar')
    montado = wrapper
    expect(wrapper.get('.marca').text()).toContain('DevBook')
    expect(wrapper.find(nav).exists()).toBe(false)
    expect(wrapper.find('[data-testid=menu-conta]').exists()).toBe(false)
    expect(usuariosApi.obter).not.toHaveBeenCalled()
  })

  it('botão de tema aparece e alterna o tema', async () => {
    vi.stubGlobal('matchMedia', undefined) // sistema "claro"
    const { wrapper } = await montar('/entrar')
    montado = wrapper
    const botao = () => wrapper.get('[data-testid=alternar-tema]')

    expect(botao().attributes('aria-label')).toBe('Ativar tema escuro')
    expect(botao().find('svg').attributes('aria-hidden')).toBe('true')
    await botao().trigger('click')

    expect(botao().attributes('aria-label')).toBe('Ativar tema claro')
    expect(document.documentElement.dataset.tema).toBe('escuro')
  })
})

describe('CabecalhoApp: navegação principal', () => {
  it('tem Início, Buscar e Perfil (o meu), cada um com ícone', async () => {
    const { wrapper } = await montarLogado()
    const links = wrapper.findAll(`${nav} a`)
    expect(links.map((a) => [a.attributes('href'), a.text()])).toEqual([
      ['/', 'Início'],
      ['/buscar', 'Buscar'],
      ['/perfil/1', 'Perfil'],
    ])
    links.forEach((a) => expect(a.find('svg').exists()).toBe(true))
  })

  it('marca a página atual com aria-current', async () => {
    const { wrapper } = await montarLogado('/buscar')
    expect(wrapper.get(`${nav} a[href="/buscar"]`).attributes('aria-current')).toBe('page')
    expect(wrapper.get(`${nav} a[href="/"]`).attributes('aria-current')).toBeUndefined()
  })

  it('Perfil fica ativo também nas minhas listas de seguidores/seguindo', async () => {
    const { wrapper } = await montarLogado('/perfil/1/seguidores')
    expect(wrapper.get(`${nav} a[href="/perfil/1"]`).attributes('aria-current')).toBe('page')
  })

  it('perfil de outra pessoa não marca o meu Perfil', async () => {
    const { wrapper } = await montarLogado('/perfil/9')
    expect(wrapper.get(`${nav} a[href="/perfil/1"]`).attributes('aria-current')).toBeUndefined()
  })
})

describe('CabecalhoApp: menu da conta', () => {
  const botao = '[data-testid=menu-conta]'
  const painel = '#menu-conta'

  it('o botão mostra as iniciais e começa fechado', async () => {
    const { wrapper } = await montarLogado()
    expect(usuariosApi.obter).toHaveBeenCalledWith(1)
    expect(wrapper.get(botao).text()).toBe('AL')
    expect(wrapper.get(botao).attributes('aria-expanded')).toBe('false')
    expect(wrapper.get(botao).attributes('aria-label')).toBe('Menu da conta')
    expect(wrapper.find(painel).exists()).toBe(false)
  })

  it('abre com nome, @nick, Minha conta e Sair', async () => {
    const { wrapper } = await montarLogado()
    await wrapper.get(botao).trigger('click')

    expect(wrapper.get(botao).attributes('aria-expanded')).toBe('true')
    expect(wrapper.get(painel).text()).toContain('Ana Lima')
    expect(wrapper.get(painel).text()).toContain('@ana')
    expect(wrapper.get(`${painel} a[href="/conta"]`).text()).toBe('Minha conta')
    expect(wrapper.get(`${painel} [data-testid=sair]`).text()).toBe('Sair')
  })

  it('Esc fecha e devolve o foco ao botão', async () => {
    const { wrapper } = await montarLogado()
    await wrapper.get(botao).trigger('click')
    await wrapper.get(`${painel} a[href="/conta"]`).trigger('keydown', { key: 'Escape' })

    expect(wrapper.find(painel).exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get(botao).element)
  })

  it('clicar fora fecha', async () => {
    const { wrapper } = await montarLogado()
    await wrapper.get(botao).trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flushPromises()
    expect(wrapper.find(painel).exists()).toBe(false)
  })

  it('navegar fecha', async () => {
    const { wrapper, router } = await montarLogado()
    await wrapper.get(botao).trigger('click')
    await router.push('/conta')
    await flushPromises()
    expect(wrapper.find(painel).exists()).toBe(false)
  })

  it('se os dados do usuário falharem, o botão continua usável', async () => {
    vi.mocked(usuariosApi.obter).mockRejectedValue(new Error('falhou'))
    const { wrapper } = await montarLogado()
    expect(wrapper.get(botao).text()).toBe('?')
    await wrapper.get(botao).trigger('click')
    expect(wrapper.find(`${painel} [data-testid=sair]`).exists()).toBe(true)
  })

  it('Sair encerra a sessão, apaga o storage e vai para /entrar', async () => {
    const { wrapper, router } = await montarLogado()
    await wrapper.get(botao).trigger('click')
    await wrapper.get('[data-testid=sair]').trigger('click')
    await flushPromises()

    expect(useSessaoStore().estaLogado).toBe(false)
    expect(useSessaoStore().usuario).toBeNull()
    expect(localStorage.getItem('devbook.sessao')).toBeNull()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('entrar'))
    expect(router.currentRoute.value.query).toEqual({}) // logout voluntário não guarda redirect
  })
})
