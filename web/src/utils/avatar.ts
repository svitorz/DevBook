// Avatar sem foto (a API não tem upload): iniciais + uma cor fixa por pessoa.

// Todas com contraste ≥ 5:1 contra texto branco, nos dois temas.
export const CORES_AVATAR = [
  '#4f46e5',
  '#0f766e',
  '#b45309',
  '#be123c',
  '#7c3aed',
  '#15803d',
  '#1d4ed8',
  '#a21caf',
] as const

/** "Ana Maria de Souza" → "AS"; "ana" → "A"; vazio → "?". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = [...partes[0]][0]
  const ultima = partes.length > 1 ? [...partes[partes.length - 1]][0] : ''
  return (primeira + ultima).toUpperCase()
}

/** Mesma semente (o nick) → mesma cor, em qualquer tela e sessão. */
export function corDoAvatar(semente: string): string {
  let h = 0
  for (const c of semente) h = (h * 31 + c.codePointAt(0)!) >>> 0
  return CORES_AVATAR[h % CORES_AVATAR.length]
}
