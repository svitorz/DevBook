import { describe, expect, it } from 'vitest'
import { tempoRelativo } from './tempo'

const AGORA = new Date('2026-11-19T15:00:00Z')
const antes = (ms: number) => new Date(AGORA.getTime() - ms).toISOString()
const MIN = 60_000
const H = 60 * MIN
const DIA = 24 * H

describe('tempoRelativo', () => {
  it('menos de 1 minuto (ou relógio adiantado): "agora"', () => {
    expect(tempoRelativo(antes(30_000), AGORA)).toBe('agora')
    expect(tempoRelativo(antes(-5 * MIN), AGORA)).toBe('agora')
  })

  it('minutos e horas', () => {
    expect(tempoRelativo(antes(5 * MIN), AGORA)).toBe('há 5 min')
    expect(tempoRelativo(antes(59 * MIN), AGORA)).toBe('há 59 min')
    expect(tempoRelativo(antes(3 * H), AGORA)).toBe('há 3 h')
  })

  it('dias: "ontem" e "há N dias" até uma semana', () => {
    expect(tempoRelativo(antes(DIA + H), AGORA)).toBe('ontem')
    expect(tempoRelativo(antes(3 * DIA), AGORA)).toBe('há 3 dias')
  })

  it('mais de uma semana: a data (com ano só se for outro ano)', () => {
    expect(tempoRelativo('2026-11-01T12:00:00Z', AGORA)).toMatch(/^1 de nov/)
    expect(tempoRelativo('2025-03-10T12:00:00Z', AGORA)).toMatch(/^10 de mar.* 2025$/)
  })

  it('data inválida não quebra', () => {
    expect(tempoRelativo('lixo', AGORA)).toBe('')
  })
})
