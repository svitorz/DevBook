import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'
import CabecalhoApp from './CabecalhoApp.vue'

async function montar() {
  const router = criarRouter(createMemoryHistory())
  await router.push('/')
  const wrapper = mount(CabecalhoApp, { global: { plugins: [router] } })
  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('CabecalhoApp', () => {
  it('deslogado: só a marca, sem botão Sair', async () => {
    const { wrapper } = await montar()
    expect(wrapper.text()).toContain('DevBook')
    expect(wrapper.find('[data-testid=sair]').exists()).toBe(false)
  })

  it('Sair encerra a sessão, apaga o storage e vai para /entrar', async () => {
    localStorage.setItem('devbook.sessao', JSON.stringify({ id: 1, token: 'tok' }))
    const { wrapper, router } = await montar()
    expect(router.currentRoute.value.name).toBe('inicio')

    await wrapper.get('[data-testid=sair]').trigger('click')
    await flushPromises()

    expect(useSessaoStore().estaLogado).toBe(false)
    expect(localStorage.getItem('devbook.sessao')).toBeNull()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('entrar'))
    expect(router.currentRoute.value.query).toEqual({}) // logout voluntário não guarda redirect
  })
})
