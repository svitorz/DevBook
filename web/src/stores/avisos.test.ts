import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AvisosApp from '../components/AvisosApp.vue'
import { useAvisosStore } from './avisos'

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
})
afterEach(() => vi.useRealTimers())

describe('avisos', () => {
  it('avisar mostra a mensagem numa região aria-live e some sozinha', async () => {
    const w = mount(AvisosApp)
    expect(w.get('.avisos').attributes('aria-live')).toBe('polite') // a região existe antes da mensagem

    useAvisosStore().avisar('Publicado.')
    await w.vm.$nextTick()
    expect(w.get('.avisos').text()).toBe('Publicado.')

    vi.advanceTimersByTime(4000)
    await w.vm.$nextTick()
    expect(w.get('.avisos').text()).toBe('')
  })

  it('vários avisos convivem e saem na ordem', () => {
    const avisos = useAvisosStore()
    avisos.avisar('um')
    vi.advanceTimersByTime(1000)
    avisos.avisar('dois')
    expect(avisos.avisos.map((a) => a.texto)).toEqual(['um', 'dois'])
    vi.advanceTimersByTime(2600)
    expect(avisos.avisos.map((a) => a.texto)).toEqual(['dois'])
  })
})
