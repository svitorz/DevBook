// "há 5 min", "ontem", "3 de nov." — texto escrito à mão em vez do
// Intl.RelativeTimeFormat, cuja saída muda conforme a versão do ICU.
// O texto não se atualiza sozinho com a página aberta; muda ao recarregar ou navegar.

const MIN = 60_000
const HORA = 60 * MIN
const DIA = 24 * HORA

const diaMes = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' })
const diaMesAno = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })

export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  const diff = agora.getTime() - data.getTime()

  if (diff < MIN) return 'agora' // inclui relógio do cliente atrasado (diff negativo)
  if (diff < HORA) return `há ${Math.floor(diff / MIN)} min`
  if (diff < DIA) return `há ${Math.floor(diff / HORA)} h`
  const dias = Math.floor(diff / DIA)
  if (dias === 1) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return (data.getFullYear() === agora.getFullYear() ? diaMes : diaMesAno).format(data)
}

const completa = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** "19/11/2026, 17:37": vai no title, para quem quer a hora exata. */
export function dataCompleta(iso: string): string {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? '' : completa.format(data)
}
