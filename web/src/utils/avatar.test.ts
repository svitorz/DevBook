import { describe, expect, it } from 'vitest'
import { CORES_AVATAR, corDoAvatar, iniciais } from './avatar'

// Sempre a partir do NICK: a publicação só traz o nick (não o nome), e a mesma
// pessoa precisa ter o mesmo avatar no cabeçalho, nos cartões e no perfil.
describe('iniciais', () => {
  it('nick com separador: primeira letra das partes, em maiúscula', () => {
    expect(iniciais('c0_visual')).toBe('CV')
    expect(iniciais('ana.lima')).toBe('AL')
    expect(iniciais('joao-silva')).toBe('JS')
  })

  it('mais de duas partes: primeira e última', () => {
    expect(iniciais('ana_maria_souza')).toBe('AS')
  })

  it('nick sem separador: só a primeira letra', () => {
    expect(iniciais('ana')).toBe('A')
  })

  it('ignora separadores repetidos ou nas pontas e não quebra em letra acentuada', () => {
    expect(iniciais('__érica__ómega_')).toBe('ÉÓ')
  })

  it('vazio vira "?"', () => {
    expect(iniciais('   ')).toBe('?')
    expect(iniciais('')).toBe('?')
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
