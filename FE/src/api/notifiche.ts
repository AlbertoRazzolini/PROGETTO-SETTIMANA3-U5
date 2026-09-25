import { api } from './client'
import type { Notifica, Pagina } from './types'

export async function elencoNotifiche(page: number, soloNonLette: boolean, signal?: AbortSignal): Promise<Pagina<Notifica>> {
  const { data } = await api.get<Pagina<Notifica>>('/notifiche', { params: { page, nonLette: soloNonLette }, signal })
  return data
}

export async function conteggioNonLette(): Promise<number> {
  const { data } = await api.get<{ nonLette: number }>('/notifiche/conteggio')
  return data.nonLette
}

export async function segnaLetta(id: string): Promise<void> {
  await api.patch(`/notifiche/${id}/letta`)
}

export async function segnaTutteLette(): Promise<void> {
  await api.patch('/notifiche/lette')
}
