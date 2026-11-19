import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { publicacoesApi } from '../api/endpoints'
import type { Publicacao } from '../api/types'
import { useSessaoStore } from '../stores/sessao'
import InicioView from './InicioView.vue'

function pub(id: number, autor_id: number): Publicacao {
  return { id, titulo: `t${id}`, conteudo: 'c', autor_id, autor_nick: `u${autor_id}`, curtidas: 0, curtiu: false, criadaEm: '2026-11-19T10:00:00-03:00' }
}

beforeEach(() => {
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
    const w = mount(InicioView)
    await flushPromises()

    const cartoes = w.findAll('article')
    expect(cartoes).toHaveLength(2)
    expect(cartoes[0].find('[data-testid=editar]').exists()).toBe(false)
    expect(cartoes[1].find('[data-testid=editar]').exists()).toBe(true)
  })

  it('feed vazio mostra orientação', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValue([])
    const w = mount(InicioView)
    await flushPromises()
    expect(w.get('[data-testid=vazio]').text()).toContain('Nenhuma publicação')
  })

  it('erro ao carregar mostra a mensagem e "Tentar de novo" recarrega', async () => {
    const feed = vi
      .spyOn(publicacoesApi, 'feed')
      .mockRejectedValueOnce(new ApiError(0, 'Não foi possível conectar à API.'))
      .mockResolvedValueOnce([pub(1, 1)])
    const w = mount(InicioView)
    await flushPromises()
    expect(w.get('[role=alert]').text()).toContain('Não foi possível conectar à API.')

    await w.get('[data-testid=tentar-de-novo]').trigger('click')
    await flushPromises()

    expect(feed).toHaveBeenCalledTimes(2)
    expect(w.findAll('article')).toHaveLength(1)
  })

  it('publicar cria e recarrega o feed', async () => {
    vi.spyOn(publicacoesApi, 'feed').mockResolvedValueOnce([]).mockResolvedValueOnce([pub(3, 1)])
    const criar = vi.spyOn(publicacoesApi, 'criar').mockResolvedValue(pub(3, 1))
    const w = mount(InicioView)
    await flushPromises()

    await w.get('input[name=titulo]').setValue('Oi')
    await w.get('textarea[name=conteudo]').setValue('Primeiro post')
    await w.get('form').trigger('submit')
    await flushPromises()

    expect(criar).toHaveBeenCalledWith({ titulo: 'Oi', conteudo: 'Primeiro post' })
    expect(w.findAll('article')).toHaveLength(1)
  })
})
