import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import FormPublicacao from './FormPublicacao.vue'

function montar(props: Record<string, unknown> = {}) {
  return mount(FormPublicacao, { props: { rotulo: 'Publicar', aoSalvar: vi.fn().mockResolvedValue(undefined), ...props } })
}

async function preencher(w: ReturnType<typeof montar>, titulo: string, conteudo: string) {
  await w.get('input[name=titulo]').setValue(titulo)
  await w.get('textarea[name=conteudo]').setValue(conteudo)
}

describe('FormPublicacao', () => {
  it('envia título e conteúdo sem espaços nas pontas', async () => {
    const aoSalvar = vi.fn().mockResolvedValue(undefined)
    const w = montar({ aoSalvar })
    await preencher(w, '  Olá  ', '  mundo ')

    await w.get('form').trigger('submit')
    await flushPromises()

    expect(aoSalvar).toHaveBeenCalledWith({ titulo: 'Olá', conteudo: 'mundo' })
  })

  it('focarTitulo põe o cursor no título ao montar (edição no cartão)', () => {
    const w = mount(FormPublicacao, {
      attachTo: document.body,
      props: { rotulo: 'Salvar', aoSalvar: vi.fn(), focarTitulo: true },
    })
    expect(document.activeElement).toBe(w.get('input[name=titulo]').element)
    w.unmount()
  })

  it('erro da API aparece e o texto digitado fica', async () => {
    const w = montar({ aoSalvar: vi.fn().mockRejectedValue(new ApiError(400, 'o título da publicação não pode estar vazio')) })
    await preencher(w, 'x', 'texto')

    await w.get('form').trigger('submit')
    await flushPromises()

    expect(w.get('[role=alert]').text()).toBe('o título da publicação não pode estar vazio')
    expect((w.get('textarea[name=conteudo]').element as HTMLTextAreaElement).value).toBe('texto')
  })

  it('começa com os valores iniciais (edição) e emite cancelar', async () => {
    const w = montar({ inicial: { titulo: 'antigo', conteudo: 'corpo' }, cancelavel: true })
    expect((w.get('input[name=titulo]').element as HTMLInputElement).value).toBe('antigo')

    await w.get('[data-testid=cancelar]').trigger('click')
    expect(w.emitted('cancelar')).toHaveLength(1)
  })

  it('respeita os limites da API (50 / 300) e mostra quantos caracteres restam', async () => {
    const w = montar()
    expect(w.get('input[name=titulo]').attributes('maxlength')).toBe('50')
    expect(w.get('textarea[name=conteudo]').attributes('maxlength')).toBe('300')
    await preencher(w, 't', 'abc')
    expect(w.get('[data-testid=restantes]').text()).toContain('297')
  })

  it('trava o botão enquanto salva', async () => {
    let resolver!: () => void
    const w = montar({ aoSalvar: vi.fn(() => new Promise<void>((r) => (resolver = r))) })
    await preencher(w, 't', 'c')
    await w.get('form').trigger('submit')

    expect(w.get('button[type=submit]').attributes('disabled')).toBeDefined()
    resolver()
    await flushPromises()
    expect(w.get('button[type=submit]').attributes('disabled')).toBeUndefined()
  })
})
