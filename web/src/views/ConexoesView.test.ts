import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import App from '../App.vue'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'

function usuario(id: number): Usuario {
  return { id, nome: `Nome ${id}`, nick: `u${id}`, email: `u${id}@x.test`, criadoem: '2026-01-15T12:00:00Z' }
}

async function abrir(url: string) {
  const router = criarRouter(createMemoryHistory())
  await router.push(url)
  const wrapper = mount(App, { global: { plugins: [router] } })
  await vi.waitFor(() => expect(wrapper.find('h1').exists()).toBe(true))
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
  const sessao = useSessaoStore()
  sessao.token = 'tok'
  sessao.usuarioId = 1
  vi.spyOn(usuariosApi, 'obter').mockImplementation(async (id) => usuario(id))
})

describe('ConexoesView', () => {
  it('seguidores: título com o nick e cada pessoa linka para o perfil', async () => {
    const seguidores = vi.spyOn(usuariosApi, 'seguidores').mockResolvedValue([usuario(3), usuario(4)])
    const { wrapper } = await abrir('/perfil/9/seguidores')

    expect(seguidores).toHaveBeenCalledWith(9)
    expect(wrapper.get('h1').text()).toBe('Seguidores de @u9')
    expect(wrapper.get('a[href="/perfil/3"]').text()).toContain('@u3')
    expect(wrapper.find('a[href="/perfil/4"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('u3@x.test')
  })

  it('seguindo usa o outro endpoint', async () => {
    const seguindo = vi.spyOn(usuariosApi, 'seguindo').mockResolvedValue([])
    const { wrapper } = await abrir('/perfil/9/seguindo')

    expect(seguindo).toHaveBeenCalledWith(9)
    expect(wrapper.get('h1').text()).toBe('@u9 segue')
    expect(wrapper.text()).toContain('Ninguém por aqui ainda.')
  })

  it('tipo desconhecido não casa com a rota', async () => {
    const router = criarRouter(createMemoryHistory())
    await router.push('/perfil/9/amigos')
    expect(router.currentRoute.value.name).toBe('inicio')
  })
})
