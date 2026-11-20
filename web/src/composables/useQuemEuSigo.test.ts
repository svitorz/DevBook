import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { usuariosApi } from '../api/endpoints'
import type { Usuario } from '../api/types'
import { useSessaoStore } from '../stores/sessao'
import { useQuemEuSigo } from './useQuemEuSigo'

const u = (id: number): Usuario => ({ id, nome: `N${id}`, nick: `u${id}`, email: '', criadoem: '' })

beforeEach(() => {
  vi.restoreAllMocks()
  setActivePinia(createPinia())
  useSessaoStore().usuarioId = 1
})

describe('useQuemEuSigo', () => {
  it('carrega quem o usuário logado segue', async () => {
    const seguindo = vi.spyOn(usuariosApi, 'seguindo').mockResolvedValue([u(3), u(4)])
    const q = useQuemEuSigo()
    expect(q.pronto.value).toBe(false)
    await q.carregar()
    expect(seguindo).toHaveBeenCalledWith(1)
    expect(q.pronto.value).toBe(true)
    expect(q.sigo(3)).toBe(true)
    expect(q.sigo(5)).toBe(false)
  })

  it('falha ao carregar: continua não-pronto (a tela esconde os botões)', async () => {
    vi.spyOn(usuariosApi, 'seguindo').mockRejectedValue(new ApiError(0, 'sem conexão'))
    const q = useQuemEuSigo()
    await q.carregar()
    expect(q.pronto.value).toBe(false)
  })

  it('definir chama a API certa e só muda o estado depois dela', async () => {
    vi.spyOn(usuariosApi, 'seguindo').mockResolvedValue([u(3)])
    const seguir = vi.spyOn(usuariosApi, 'seguir').mockResolvedValue(undefined)
    const parar = vi.spyOn(usuariosApi, 'pararDeSeguir').mockRejectedValueOnce(new ApiError(500, 'x')).mockResolvedValue(undefined)
    const q = useQuemEuSigo()
    await q.carregar()

    await q.definir(5, true)
    expect(seguir).toHaveBeenCalledWith(5)
    expect(q.sigo(5)).toBe(true)

    await expect(q.definir(3, false)).rejects.toThrow()
    expect(q.sigo(3)).toBe(true) // a API falhou: nada muda
    await q.definir(3, false)
    expect(parar).toHaveBeenCalledWith(3)
    expect(q.sigo(3)).toBe(false)
  })
})
