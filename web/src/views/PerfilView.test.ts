import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { ApiError } from '../api/client'
import { publicacoesApi, usuariosApi } from '../api/endpoints'
import type { Publicacao, Usuario } from '../api/types'
import App from '../App.vue'
import { criarRouter } from '../router'
import { useSessaoStore } from '../stores/sessao'

const EU = 1
function usuario(id: number): Usuario {
  return { id, nome: `Nome ${id}`, nick: `u${id}`, email: `u${id}@x.test`, criadoem: '2026-01-15T12:00:00Z' }
}
function pub(id: number, autor_id: number): Publicacao {
  return { id, titulo: `t${id}`, conteudo: 'c', autor_id, autor_nick: `u${autor_id}`, curtidas: 0, curtiu: false, criadaEm: '2026-11-19T10:00:00Z' }
}

function mockPerfil(id: number, seguidores: Usuario[] = [], seguindo: Usuario[] = [], posts: Publicacao[] = []) {
  vi.spyOn(usuariosApi, 'obter').mockImplementation(async (i) => (i === id ? usuario(id) : usuario(i)))
  vi.spyOn(usuariosApi, 'seguidores').mockResolvedValue(seguidores)
  vi.spyOn(usuariosApi, 'seguindo').mockResolvedValue(seguindo)
  vi.spyOn(publicacoesApi, 'doUsuario').mockResolvedValue(posts)
}

async function abrir(url: string) {
  const router = criarRouter(createMemoryHistory())
  await router.push(url)
  const wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  await vi.waitFor(() => expect(wrapper.find('[data-testid=perfil], [role=alert]').exists()).toBe(true))
  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
  const sessao = useSessaoStore()
  sessao.token = 'tok'
  sessao.usuarioId = EU
})

describe('PerfilView', () => {
  it('mostra nome, nick, contagens e as publicações do usuário (sem e-mail)', async () => {
    mockPerfil(9, [usuario(3)], [usuario(4), usuario(5)], [pub(20, 9)])
    const { wrapper } = await abrir('/perfil/9')

    expect(wrapper.text()).toContain('Nome 9')
    expect(wrapper.text()).toContain('@u9')
    expect(wrapper.text()).not.toContain('u9@x.test')
    expect(wrapper.get('a[href="/perfil/9/seguidores"]').text()).toBe('1 seguidor') // singular
    expect(wrapper.get('a[href="/perfil/9/seguindo"]').text()).toBe('2 seguindo')
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(publicacoesApi.doUsuario).toHaveBeenCalledWith(9)
  })

  it('perfil de outro que eu não sigo: Seguir; ao seguir, recarrega seguidores e vira Deixar de seguir', async () => {
    mockPerfil(9)
    const seguir = vi.spyOn(usuariosApi, 'seguir').mockResolvedValue(undefined)
    const { wrapper } = await abrir('/perfil/9')
    const botao = () => wrapper.get('[data-testid=seguir]')
    expect(botao().text()).toBe('Seguir')

    vi.mocked(usuariosApi.seguidores).mockResolvedValue([usuario(EU)])
    await botao().trigger('click')
    await flushPromises()

    expect(seguir).toHaveBeenCalledWith(9)
    expect(botao().text()).toBe('Deixar de seguir')
    expect(wrapper.get('a[href="/perfil/9/seguidores"]').text()).toContain('1')
  })

  it('perfil de quem eu sigo: Deixar de seguir chama parar-de-seguir', async () => {
    mockPerfil(9, [usuario(EU)])
    const parar = vi.spyOn(usuariosApi, 'pararDeSeguir').mockResolvedValue(undefined)
    const { wrapper } = await abrir('/perfil/9')

    vi.mocked(usuariosApi.seguidores).mockResolvedValue([])
    await wrapper.get('[data-testid=seguir]').trigger('click')
    await flushPromises()

    expect(parar).toHaveBeenCalledWith(9)
    expect(wrapper.get('[data-testid=seguir]').text()).toBe('Seguir')
  })

  it('meu próprio perfil: sem botão de seguir e com Editar nas publicações', async () => {
    mockPerfil(EU, [], [], [pub(30, EU)])
    const { wrapper } = await abrir(`/perfil/${EU}`)
    expect(wrapper.find('[data-testid=seguir]').exists()).toBe(false)
    expect(wrapper.find('[data-testid=editar]').exists()).toBe(true)
  })

  it('usuário inexistente mostra "não encontrado"', async () => {
    mockPerfil(9)
    vi.mocked(usuariosApi.obter).mockRejectedValue(new ApiError(404, 'recurso não encontrado'))
    const { wrapper } = await abrir('/perfil/999')
    expect(wrapper.get('[role=alert]').text()).toContain('Usuário não encontrado')
  })

  it('trocar de perfil pela URL recarrega os dados', async () => {
    mockPerfil(9)
    const { wrapper, router } = await abrir('/perfil/9')
    await router.push('/perfil/7')
    await flushPromises()
    expect(usuariosApi.obter).toHaveBeenLastCalledWith(7)
    expect(wrapper.text()).toContain('Nome 7')
  })

  it('id não numérico não casa com a rota', async () => {
    const router = criarRouter(createMemoryHistory())
    await router.push('/perfil/abc')
    expect(router.currentRoute.value.name).toBe('inicio')
  })
})
