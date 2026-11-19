import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import type { Publicacao } from '../api/types'
import CartaoPublicacao from './CartaoPublicacao.vue'

const PUB: Publicacao = {
  id: 7,
  titulo: 'Título',
  conteudo: 'Conteúdo do post',
  autor_id: 1,
  autor_nick: 'ana',
  curtidas: 2,
  curtiu: false,
  criadaEm: '2026-11-19T10:30:00-03:00',
}

function montar(props: Record<string, unknown> = {}) {
  return mount(CartaoPublicacao, {
    props: {
      publicacao: PUB,
      ehMinha: false,
      aoCurtir: vi.fn().mockResolvedValue(undefined),
      aoEditar: vi.fn().mockResolvedValue(undefined),
      aoExcluir: vi.fn().mockResolvedValue(undefined),
      ...props,
    },
  })
}

afterEach(() => vi.restoreAllMocks())

describe('CartaoPublicacao', () => {
  it('mostra título, conteúdo, autor, data e curtidas', () => {
    const w = montar()
    expect(w.text()).toContain('Título')
    expect(w.text()).toContain('Conteúdo do post')
    expect(w.text()).toContain('@ana')
    expect(w.get('time').attributes('datetime')).toBe(PUB.criadaEm)
    expect(w.get('[data-testid=curtir]').text()).toContain('2')
  })

  it('o botão reflete curtiu (aria-pressed) e chama aoCurtir com o id', async () => {
    const aoCurtir = vi.fn().mockResolvedValue(undefined)
    const w = montar({ aoCurtir })
    expect(w.get('[data-testid=curtir]').attributes('aria-pressed')).toBe('false')

    await w.get('[data-testid=curtir]').trigger('click')
    expect(aoCurtir).toHaveBeenCalledWith(7)

    await w.setProps({ publicacao: { ...PUB, curtiu: true } })
    expect(w.get('[data-testid=curtir]').attributes('aria-pressed')).toBe('true')
  })

  it('publicação de outro: sem Editar/Excluir', () => {
    const w = montar()
    expect(w.find('[data-testid=editar]').exists()).toBe(false)
    expect(w.find('[data-testid=excluir]').exists()).toBe(false)
  })

  it('editar abre o formulário com os valores atuais e fecha ao salvar', async () => {
    const aoEditar = vi.fn().mockResolvedValue(undefined)
    const w = montar({ ehMinha: true, aoEditar })

    await w.get('[data-testid=editar]').trigger('click')
    expect((w.get('input[name=titulo]').element as HTMLInputElement).value).toBe('Título')
    await w.get('input[name=titulo]').setValue('Novo')
    await w.get('form').trigger('submit')
    await flushPromises()

    expect(aoEditar).toHaveBeenCalledWith(7, { titulo: 'Novo', conteudo: 'Conteúdo do post' })
    expect(w.find('form').exists()).toBe(false)
  })

  it('excluir pede confirmação; cancelado não chama a API', async () => {
    const aoExcluir = vi.fn().mockResolvedValue(undefined)
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const w = montar({ ehMinha: true, aoExcluir })

    await w.get('[data-testid=excluir]').trigger('click')
    expect(confirmar).toHaveBeenCalled()
    expect(aoExcluir).not.toHaveBeenCalled()

    confirmar.mockReturnValue(true)
    await w.get('[data-testid=excluir]').trigger('click')
    expect(aoExcluir).toHaveBeenCalledWith(7)
  })

  it('erro ao curtir aparece no cartão', async () => {
    const w = montar({ aoCurtir: vi.fn().mockRejectedValue(new ApiError(404, 'publicação não encontrada')) })
    await w.get('[data-testid=curtir]').trigger('click')
    await flushPromises()
    expect(w.get('[role=alert]').text()).toBe('publicação não encontrada')
  })
})
