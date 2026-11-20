import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { publicacoesApi } from '../api/endpoints'
import type { Publicacao } from '../api/types'
import { useAvisosStore } from '../stores/avisos'
import { useSessaoStore } from '../stores/sessao'
import InicioView from './InicioView.vue'

function pub(id: number, autor_id: number): Publicacao {
  return { id, titulo: `t${id}`, conteudo: 'c', autor_id, autor_nick: `u${autor_id}`, curtidas: 0, curtiu: false, criadaEm: '2026-11-19T10:00:00-03:00' }
}

function montar() {
  return mount(InicioView, { attachTo: document.body, global: { stubs: { RouterLink: RouterLinkStub } } })
}

beforeEach(() => {
  document.body.innerHTML = ''
  localStorage.clear()
  vi.restoreAllMocks()
  setActivePinia(createPinia())
  const sessao = useSessaoStore()
  sessao.token = 'tok'
  sessao.usuarioId = 1
})

describe('InicioView (feed)', () => {
  it('lista o feed e só as publicações do usuário logado têm Editar', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValue([pub(2, 9), pub(1, 1)])
    const w = montar()
    await flushPromises()

    const cartoes = w.findAll('article')
    expect(cartoes).toHaveLength(2)
    expect(cartoes[0].find('[data-testid=editar]').exists()).toBe(false)
    expect(cartoes[1].find('[data-testid=editar]').exists()).toBe(true)
  })

  it('feed vazio mostra orientação', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValue([])
    const w = montar()
    await flushPromises()
    expect(w.get('[data-testid=vazio]').text()).toContain('Nenhuma publicação')
  })

  it('erro ao carregar mostra a mensagem e "Tentar de novo" recarrega', async () => {
    const feed = vi
      .spyOn(publicacoesApi, 'feed')
      .mockRejectedValueOnce(new ApiError(0, 'Não foi possível conectar à API.'))
      .mockResolvedValueOnce([pub(1, 1)])
    const w = montar()
    await flushPromises()
    expect(w.get('[role=alert]').text()).toContain('Não foi possível conectar à API.')

    await w.get('[data-testid=tentar-de-novo]').trigger('click')
    await flushPromises()

    expect(feed).toHaveBeenCalledTimes(2)
    expect(w.findAll('article')).toHaveLength(1)
  })

  it('enquanto carrega mostra esqueletos (e um texto para leitor de tela)', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockReturnValue(new Promise(() => {})) // nunca responde
    const w = montar()
    await flushPromises()
    expect(w.findAll('[data-testid=esqueleto]')).toHaveLength(3)
    expect(w.get('section[aria-label=Feed]').attributes('aria-busy')).toBe('true')
    expect(w.get('.visualmente-oculto').text()).toBe('Carregando publicações…')
  })

  it('o formulário não fica na tela: "Novo post" abre o modal com título e corpo', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValue([])
    const w = montar()
    await flushPromises()
    const dialogo = () => w.get('dialog').element as HTMLDialogElement
    expect(dialogo().open).toBe(false)

    await w.get('[data-testid=novo-post]').trigger('click')
    expect(dialogo().open).toBe(true)
    expect(document.activeElement).toBe(w.get('dialog input[name=titulo]').element)
    expect(w.find('dialog textarea[name=conteudo]').exists()).toBe(true)

    await w.get('dialog [data-testid=cancelar]').trigger('click')
    expect(dialogo().open).toBe(false)
  })

  it('publicar pelo modal cria, fecha, recarrega o feed e avisa', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValueOnce([]).mockResolvedValueOnce([pub(3, 1)])
    const criar = vi.spyOn(publicacoesApi, 'criar').mockResolvedValue(pub(3, 1))
    const w = montar()
    await flushPromises()

    await w.get('[data-testid=novo-post]').trigger('click')
    await w.get('dialog input[name=titulo]').setValue('Oi')
    await w.get('dialog textarea[name=conteudo]').setValue('Primeiro post')
    await w.get('dialog form').trigger('submit')
    await flushPromises()

    expect(criar).toHaveBeenCalledWith({ titulo: 'Oi', conteudo: 'Primeiro post' })
    expect((w.get('dialog').element as HTMLDialogElement).open).toBe(false)
    expect(w.findAll('article')).toHaveLength(1)
    expect(useAvisosStore().avisos.map((a) => a.texto)).toEqual(['Publicado.'])
  })

  it('erro ao publicar mantém o modal aberto, com a mensagem e o texto digitado', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValue([])
    vi.spyOn(publicacoesApi, 'criar').mockRejectedValue(new ApiError(400, 'o título da publicação não pode estar vazio'))
    const w = montar()
    await flushPromises()

    await w.get('[data-testid=novo-post]').trigger('click')
    await w.get('dialog input[name=titulo]').setValue('x')
    await w.get('dialog textarea[name=conteudo]').setValue('texto')
    await w.get('dialog form').trigger('submit')
    await flushPromises()

    expect((w.get('dialog').element as HTMLDialogElement).open).toBe(true)
    expect(w.get('dialog [role=alert]').text()).toBe('o título da publicação não pode estar vazio')
    expect((w.get('dialog textarea[name=conteudo]').element as HTMLTextAreaElement).value).toBe('texto')
  })

  it('reabrir depois de cancelar começa com o formulário limpo', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValue([])
    const w = montar()
    await flushPromises()
    await w.get('[data-testid=novo-post]').trigger('click')
    await w.get('dialog input[name=titulo]').setValue('rascunho')
    await w.get('dialog [data-testid=cancelar]').trigger('click')
    await w.get('[data-testid=novo-post]').trigger('click')
    expect((w.get('dialog input[name=titulo]').element as HTMLInputElement).value).toBe('')
  })
})
