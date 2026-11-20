import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTemaStore } from './tema'

const CHAVE = 'devbook.tema'

// jsdom não implementa matchMedia; simulamos o "tema do sistema".
function sistemaEscuro(escuro: boolean) {
  const ouvintes: ((e: { matches: boolean }) => void)[] = []
  const mq = {
    matches: escuro,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => ouvintes.push(fn),
    removeEventListener: () => {},
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mq))
  return (novo: boolean) => ouvintes.forEach((fn) => fn({ matches: novo }))
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.tema
  setActivePinia(createPinia())
})

afterEach(() => vi.unstubAllGlobals())

describe('tema', () => {
  it('sem escolha salva segue o sistema e não força atributo no <html>', () => {
    sistemaEscuro(true)
    const tema = useTemaStore()
    expect(tema.atual).toBe('escuro')
    expect(document.documentElement.dataset.tema).toBeUndefined()
  })

  it('sem escolha, acompanha a troca de tema do sistema', () => {
    const mudarSistema = sistemaEscuro(false)
    const tema = useTemaStore()
    expect(tema.atual).toBe('claro')
    mudarSistema(true)
    expect(tema.atual).toBe('escuro')
  })

  it('alternar grava a escolha, aplica no <html> e passa a ignorar o sistema', () => {
    const mudarSistema = sistemaEscuro(true)
    const tema = useTemaStore()

    tema.alternar()

    expect(tema.atual).toBe('claro')
    expect(localStorage.getItem(CHAVE)).toBe('claro')
    expect(document.documentElement.dataset.tema).toBe('claro')
    mudarSistema(false)
    mudarSistema(true)
    expect(tema.atual).toBe('claro')
  })

  it('restaura a escolha salva', () => {
    sistemaEscuro(false)
    localStorage.setItem(CHAVE, 'escuro')
    const tema = useTemaStore()
    expect(tema.atual).toBe('escuro')
    expect(document.documentElement.dataset.tema).toBe('escuro')
  })

  it('valor salvo inválido é ignorado', () => {
    sistemaEscuro(false)
    localStorage.setItem(CHAVE, 'roxo')
    expect(useTemaStore().atual).toBe('claro')
  })

  it('sem matchMedia (ambiente antigo) assume claro', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(useTemaStore().atual).toBe('claro')
  })
})
