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

const ABAS = 'nav[aria-label="Seções do perfil"]'

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
  it('mostra avatar grande, nome, nick, abas com contagens e as publicações (sem e-mail)', async () => {
    mockPerfil(9, [usuario(3)], [usuario(4), usuario(5)], [pub(20, 9)])
    const { wrapper } = await abrir('/perfil/9')

    expect(wrapper.text()).toContain('Nome 9')
    expect(wrapper.text()).toContain('@u9')
    expect(wrapper.text()).not.toContain('u9@x.test')
    const avatar = wrapper.get('[data-testid=perfil] .avatar')
    expect(avatar.text()).toBe('U')
    expect(avatar.attributes('style')).toContain('width: 72px')
    expect(wrapper.get(`${ABAS} a[href="/perfil/9"]`).text()).toBe('1 publicação') // singular
    expect(wrapper.get(`${ABAS} a[href="/perfil/9/seguidores"]`).text()).toBe('1 seguidor')
    expect(wrapper.get(`${ABAS} a[href="/perfil/9/seguindo"]`).text()).toBe('2 seguindo')
    expect(wrapper.findAll('article')).toHaveLength(1)
    expect(publicacoesApi.doUsuario).toHaveBeenCalledWith(9)
  })

  it('a aba atual é marcada com aria-current', async () => {
    mockPerfil(9)
    const { wrapper, router } = await abrir('/perfil/9')
    expect(wrapper.get(`${ABAS} a[href="/perfil/9"]`).attributes('aria-current')).toBe('page')
    await router.push('/perfil/9/seguindo')
    await flushPromises()
    expect(wrapper.get(`${ABAS} a[href="/perfil/9"]`).attributes('aria-current')).toBeUndefined()
    expect(wrapper.get(`${ABAS} a[href="/perfil/9/seguindo"]`).attributes('aria-current')).toBe('page')
  })

  it('trocar de aba não recarrega o perfil', async () => {
    mockPerfil(9, [usuario(3)])
    const { wrapper, router } = await abrir('/perfil/9')
    await router.push('/perfil/9/seguidores')
    await flushPromises()
    expect(usuariosApi.obter).toHaveBeenCalledTimes(2) // perfil 9 + cabeçalho (usuário logado), uma vez cada
    expect(wrapper.find('article').exists()).toBe(false)
    expect(wrapper.get('a[href="/perfil/3"]').text()).toContain('@u3')
  })

  it('aba seguidores: cada pessoa com avatar, link para o perfil e sem e-mail', async () => {
    mockPerfil(9, [usuario(3), usuario(4)])
    const { wrapper } = await abrir('/perfil/9/seguidores')

    expect(usuariosApi.seguidores).toHaveBeenCalledWith(9)
    expect(wrapper.text()).toContain('Nome 9') // o cabeçalho do perfil continua
    const link = wrapper.get('a[href="/perfil/3"]')
    expect(link.text()).toContain('@u3')
    expect(link.find('.avatar').exists()).toBe(true)
    expect(wrapper.find('a[href="/perfil/4"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('u3@x.test')
  })

  it('aba seguindo vazia mostra orientação', async () => {
    mockPerfil(9, [], [])
    const { wrapper } = await abrir('/perfil/9/seguindo')
    expect(wrapper.text()).toContain('@u9 ainda não segue ninguém.')
  })

  it('Seguir direto na lista, menos no próprio usuário logado', async () => {
    // no perfil 9: seguidores 3 e EU; eu (EU) já sigo o 3? Não; o mock de seguindo vale para todos os ids
    mockPerfil(9, [usuario(3), usuario(EU)], [])
    const seguir = vi.spyOn(usuariosApi, 'seguir').mockResolvedValue(undefined)
    const { wrapper } = await abrir('/perfil/9/seguidores')

    expect(wrapper.find(`[data-testid=seguir-${EU}]`).exists()).toBe(false)
    const botao = () => wrapper.get('[data-testid=seguir-3]')
    expect(botao().text()).toBe('Seguir')
    expect(botao().attributes('aria-label')).toBe('Seguir @u3')

    await botao().trigger('click')
    await flushPromises()
    expect(seguir).toHaveBeenCalledWith(3)
    expect(botao().text()).toBe('Deixar de seguir')
  })

  it('no meu perfil, deixar de seguir alguém pela lista atualiza a contagem', async () => {
    mockPerfil(EU, [], [usuario(4)])
    vi.spyOn(usuariosApi, 'pararDeSeguir').mockResolvedValue(undefined)
    const { wrapper } = await abrir(`/perfil/${EU}/seguindo`)
    expect(wrapper.get(`${ABAS} a[href="/perfil/${EU}/seguindo"]`).text()).toBe('1 seguindo')

    vi.mocked(usuariosApi.seguindo).mockResolvedValue([])
    await wrapper.get('[data-testid=seguir-4]').trigger('click')
    await flushPromises()

    expect(usuariosApi.pararDeSeguir).toHaveBeenCalledWith(4)
    expect(wrapper.get(`${ABAS} a[href="/perfil/${EU}/seguindo"]`).text()).toBe('0 seguindo')
  })

  it('tipo desconhecido não casa com a rota', async () => {
    const router = criarRouter(createMemoryHistory())
    await router.push('/perfil/9/amigos')
    expect(router.currentRoute.value.name).toBe('inicio')
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
    expect(wrapper.get(`${ABAS} a[href="/perfil/9/seguidores"]`).text()).toContain('1')
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

  it('meu próprio perfil: sem botão de seguir, com "Editar perfil" e Editar nas publicações', async () => {
    mockPerfil(EU, [], [], [pub(30, EU)])
    const { wrapper } = await abrir(`/perfil/${EU}`)
    expect(wrapper.find('[data-testid=seguir]').exists()).toBe(false)
    expect(wrapper.get('[data-testid=perfil] a[href="/conta"]').text()).toBe('Editar perfil')
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
