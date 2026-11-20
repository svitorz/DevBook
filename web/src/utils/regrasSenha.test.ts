import { describe, expect, it } from 'vitest'
import { regrasDaSenha, senhaValida } from './regrasSenha'

const atendidas = (s: string) => regrasDaSenha(s).filter((r) => r.ok).map((r) => r.id)

describe('regrasDaSenha (espelho de validarSenha na API)', () => {
  it('lista as 5 regras, na ordem em que a API checa', () => {
    expect(regrasDaSenha('').map((r) => r.id)).toEqual(['tamanho', 'maiuscula', 'minuscula', 'numero', 'especial'])
    expect(atendidas('')).toEqual([])
  })

  it('cada regra isolada', () => {
    expect(atendidas('abcdefgh')).toEqual(['tamanho', 'minuscula'])
    expect(atendidas('A')).toEqual(['maiuscula'])
    expect(atendidas('1')).toEqual(['numero'])
    expect(atendidas('!')).toEqual(['especial'])
  })

  it('tamanho conta BYTES, como o len() do Go: "é" vale 2', () => {
    expect(regrasDaSenha('éééé').find((r) => r.id === 'tamanho')!.ok).toBe(true) // 4 letras, 8 bytes
    expect(regrasDaSenha('abcdefg').find((r) => r.id === 'tamanho')!.ok).toBe(false)
  })

  it('especial usa o mesmo conjunto da API: ~ e espaço não contam', () => {
    expect(atendidas('~')).toEqual([])
    expect(atendidas(' ')).toEqual([])
    for (const c of '!@#$%^&*()_+-=[]{};\':"\\|,.<>/?') expect(atendidas(c), c).toEqual(['especial'])
  })

  it('senhaValida só com todas', () => {
    expect(senhaValida('Senha@123')).toBe(true)
    expect(senhaValida('Senha123')).toBe(false)
  })
})
