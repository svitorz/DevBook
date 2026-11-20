import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import JanelaModal from './JanelaModal.vue'

let w: ReturnType<typeof montar> | null = null
function montar(aberto: boolean) {
  return mount(JanelaModal, {
    props: { aberto, titulo: 'Novo post' },
    slots: { default: '<button autofocus data-testid="dentro">ok</button>' },
    attachTo: document.body,
  })
}
afterEach(() => {
  w?.unmount()
  w = null
})

const dialogo = () => w!.get('dialog').element as HTMLDialogElement

describe('JanelaModal', () => {
  it('abre como modal quando aberto, com título ligado ao dialog e foco no autofocus', async () => {
    w = montar(true)
    expect(dialogo().open).toBe(true)
    const idTitulo = w.get('dialog').attributes('aria-labelledby')!
    expect(document.getElementById(idTitulo)!.textContent).toBe('Novo post')
    expect(document.activeElement).toBe(w.get('[data-testid=dentro]').element)
  })

  it('segue a prop: fechado não abre, e abre/fecha quando ela muda', async () => {
    w = montar(false)
    expect(dialogo().open).toBe(false)
    await w.setProps({ aberto: true })
    expect(dialogo().open).toBe(true)
    await w.setProps({ aberto: false })
    expect(dialogo().open).toBe(false)
    expect(w.emitted('fechar')).toBeUndefined() // fechar pela prop não "pede" para fechar
  })

  it('o X pede para fechar', async () => {
    w = montar(true)
    await w.get('[aria-label=Fechar]').trigger('click')
    expect(w.emitted('fechar')).toHaveLength(1)
  })

  it('Esc (o navegador fecha o dialog sozinho) também avisa o pai', async () => {
    w = montar(true)
    dialogo().close() // é o que o navegador faz no Esc
    expect(w.emitted('fechar')).toHaveLength(1)
  })
})
