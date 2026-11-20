import { describe, expect, it } from 'vitest'
import { CORES_AVATAR, corDoAvatar, iniciais } from './avatar'

describe('iniciais', () => {
  it('duas palavras: primeira letra de cada, em maiúscula', () => {
    expect(iniciais('ana lima')).toBe('AL')
  })

  it('mais de duas palavras: primeira e última', () => {
    expect(iniciais('Ana Maria de Souza')).toBe('AS')
  })

  it('uma palavra: só a primeira letra', () => {
    expect(iniciais('c0_visual')).toBe('C')
  })

  it('ignora espaços extras e não quebra em letra acentuada', () => {
    expect(iniciais('  Érica   Ómega ')).toBe('ÉÓ')
  })

  it('vazio vira "?"', () => {
    expect(iniciais('   ')).toBe('?')
  })
})

describe('corDoAvatar', () => {
  it('a mesma semente dá sempre a mesma cor, e ela é da paleta', () => {
    expect(corDoAvatar('b2_outra')).toBe(corDoAvatar('b2_outra'))
    expect(CORES_AVATAR).toContain(corDoAvatar('b2_outra'))
  })

  it('espalha sementes diferentes pela paleta', () => {
    const cores = new Set(['ana', 'bob', 'carla', 'davi', 'edu', 'fabi', 'gil', 'hugo', 'iris', 'joão'].map(corDoAvatar))
    expect(cores.size).toBeGreaterThanOrEqual(4)
  })
})
