import { RouterLinkStub, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
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

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-19T14:00:00Z')) // 30 min depois de PUB.criadaEm
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('CartaoPublicacao', () => {
  it('mostra título, conteúdo, autor com avatar, data e curtidas', () => {
    const w = montar()
    expect(w.text()).toContain('Título')
    expect(w.text()).toContain('Conteúdo do post')
    expect(w.text()).toContain('@ana')
    const autor = w.getComponent(RouterLinkStub)
    expect(autor.props('to')).toBe('/perfil/1') // autor_id
    expect(autor.find('.avatar').text()).toBe('A')
    expect(w.get('[data-testid=curtir]').text()).toContain('2')
  })

  it('data relativa ("há 30 min"), com a data completa no title e no datetime', () => {
    const w = montar()
    const time = w.get('time')
    expect(time.text()).toBe('há 30 min')
    expect(time.attributes('datetime')).toBe(PUB.criadaEm)
    expect(time.attributes('title')).toMatch(/19\/11\/2026/)
  })

  it('curtir usa um coração: vazado sem curtida, preenchido com', async () => {
    const w = montar()
    const svg = () => w.get('[data-testid=curtir] svg')
    expect(svg().attributes('fill')).toBe('none')
    await w.setProps({ publicacao: { ...PUB, curtiu: true } })
    expect(svg().attributes('fill')).toBe('currentColor')
  })

  it('minha publicação: Editar e Excluir são botões de ícone com nome acessível', () => {
    const w = montar({ ehMinha: true })
    expect(w.get('[data-testid=editar]').attributes('aria-label')).toBe('Editar publicação')
    expect(w.get('[data-testid=excluir]').attributes('aria-label')).toBe('Excluir publicação')
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

  it('excluir pede confirmação num modal; cancelar não chama a API', async () => {
    const aoExcluir = vi.fn().mockResolvedValue(undefined)
    const w = montar({ ehMinha: true, aoExcluir })
    const dialogo = () => w.get('dialog').element as HTMLDialogElement
    expect(dialogo().open).toBe(false)

    await w.get('[data-testid=excluir]').trigger('click')
    expect(dialogo().open).toBe(true)
    expect(w.get('dialog').text()).toContain('Não dá para desfazer')
    expect(document.activeElement?.textContent?.trim()).toBe('Cancelar') // foco na opção segura

    await w.get('dialog [data-testid=cancelar-exclusao]').trigger('click')
    expect(dialogo().open).toBe(false)
    expect(aoExcluir).not.toHaveBeenCalled()

    await w.get('[data-testid=excluir]').trigger('click')
    await w.get('dialog [data-testid=confirmar-exclusao]').trigger('click')
    await flushPromises()
    expect(aoExcluir).toHaveBeenCalledWith(7)
    expect(dialogo().open).toBe(false)
  })

  it('erro ao curtir aparece no cartão', async () => {
    const w = montar({ aoCurtir: vi.fn().mockRejectedValue(new ApiError(404, 'publicação não encontrada')) })
    await w.get('[data-testid=curtir]').trigger('click')
    await flushPromises()
    expect(w.get('[role=alert]').text()).toBe('publicação não encontrada')
  })
})
