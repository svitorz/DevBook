import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { publicacoesApi } from '../api/endpoints'
import type { Publicacao } from '../api/types'
import { useListaDePublicacoes } from './useListaDePublicacoes'

function pub(id: number, extra: Partial<Publicacao> = {}): Publicacao {
  return {
    id,
    titulo: `t${id}`,
    conteudo: `c${id}`,
    autor_id: 1,
    autor_nick: 'ana',
    curtidas: 0,
    curtiu: false,
    criadaEm: '2026-11-19T10:00:00-03:00',
    ...extra,
  }
}

beforeEach(() => vi.restoreAllMocks())

describe('useListaDePublicacoes', () => {
  it('carregar preenche a lista e controla o "carregando"', async () => {
    const buscar = vi.fn().mockResolvedValue([pub(2), pub(1)])
    const lista = useListaDePublicacoes(buscar)

    const promessa = lista.carregar()
    expect(lista.carregando.value).toBe(true)
    await promessa

    expect(lista.carregando.value).toBe(false)
    expect(lista.publicacoes.value.map((p) => p.id)).toEqual([2, 1])
    expect(lista.erro.value).toBe('')
  })

  it('erro ao carregar vira mensagem (e a lista anterior some)', async () => {
    const buscar = vi.fn().mockResolvedValueOnce([pub(1)]).mockRejectedValueOnce(new ApiError(0, 'sem conexão'))
    const lista = useListaDePublicacoes(buscar)
    await lista.carregar()

    await lista.carregar()

    expect(lista.erro.value).toBe('sem conexão')
    expect(lista.publicacoes.value).toEqual([])
  })

  it('criar envia e recarrega (a resposta do POST não traz autor_nick nem data real)', async () => {
    const buscar = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([pub(5)])
    const criar = vi.spyOn(publicacoesApi, 'criar').mockResolvedValue(pub(5, { autor_nick: undefined }))
    const lista = useListaDePublicacoes(buscar)
    await lista.carregar()

    await lista.criar({ titulo: 'novo', conteudo: 'texto' })

    expect(criar).toHaveBeenCalledWith({ titulo: 'novo', conteudo: 'texto' })
    expect(buscar).toHaveBeenCalledTimes(2)
    expect(lista.publicacoes.value[0]).toMatchObject({ id: 5, autor_nick: 'ana' })
  })

  it('criar com erro propaga (o formulário mostra) e não recarrega', async () => {
    const buscar = vi.fn().mockResolvedValue([])
    vi.spyOn(publicacoesApi, 'criar').mockRejectedValue(new ApiError(400, 'título vazio'))
    const lista = useListaDePublicacoes(buscar)
    await lista.carregar()

    await expect(lista.criar({ titulo: '', conteudo: 'x' })).rejects.toThrow('título vazio')
    expect(buscar).toHaveBeenCalledTimes(1)
  })

  it('editar atualiza título e conteúdo no lugar', async () => {
    const lista = useListaDePublicacoes(vi.fn().mockResolvedValue([pub(1), pub(2)]))
    await lista.carregar()
    const atualizar = vi.spyOn(publicacoesApi, 'atualizar').mockResolvedValue(undefined)

    await lista.editar(2, { titulo: 'novo', conteudo: 'outro' })

    expect(atualizar).toHaveBeenCalledWith(2, { titulo: 'novo', conteudo: 'outro' })
    expect(lista.publicacoes.value[1]).toMatchObject({ id: 2, titulo: 'novo', conteudo: 'outro' })
  })

  it('excluir tira da lista só depois do 204', async () => {
    const lista = useListaDePublicacoes(vi.fn().mockResolvedValue([pub(1), pub(2)]))
    await lista.carregar()
    vi.spyOn(publicacoesApi, 'deletar').mockRejectedValueOnce(new ApiError(403, 'não é sua'))

    await expect(lista.excluir(1)).rejects.toThrow()
    expect(lista.publicacoes.value).toHaveLength(2)

    vi.spyOn(publicacoesApi, 'deletar').mockResolvedValue(undefined)
    await lista.excluir(1)
    expect(lista.publicacoes.value.map((p) => p.id)).toEqual([2])
  })

  it('alternarCurtida curte quando não curtiu e descurte quando curtiu', async () => {
    const lista = useListaDePublicacoes(
      vi.fn().mockResolvedValue([pub(1, { curtidas: 3 }), pub(2, { curtidas: 1, curtiu: true })]),
    )
    await lista.carregar()
    const curtir = vi.spyOn(publicacoesApi, 'curtir').mockResolvedValue(undefined)
    const descurtir = vi.spyOn(publicacoesApi, 'descurtir').mockResolvedValue(undefined)

    await lista.alternarCurtida(1)
    await lista.alternarCurtida(2)

    expect(curtir).toHaveBeenCalledWith(1)
    expect(descurtir).toHaveBeenCalledWith(2)
    expect(lista.publicacoes.value[0]).toMatchObject({ curtiu: true, curtidas: 4 })
    expect(lista.publicacoes.value[1]).toMatchObject({ curtiu: false, curtidas: 0 })
  })

  it('alternarCurtida com erro não mexe no estado', async () => {
    const lista = useListaDePublicacoes(vi.fn().mockResolvedValue([pub(1, { curtidas: 3 })]))
    await lista.carregar()
    vi.spyOn(publicacoesApi, 'curtir').mockRejectedValue(new ApiError(404, 'publicação não encontrada'))

    await expect(lista.alternarCurtida(1)).rejects.toThrow()
    expect(lista.publicacoes.value[0]).toMatchObject({ curtiu: false, curtidas: 3 })
  })
})
