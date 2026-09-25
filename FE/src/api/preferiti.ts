import { api } from './client'
import type { Avviso, Pagina, Preferito } from './types'

// Il BE non ha un endpoint "questa auto e' tra i miei preferiti?": si scaricano tutte le pagine
// (10 elementi l'una) e il FE tiene l'elenco completo in memoria.
async function tutteLePagine<T>(url: string): Promise<T[]> {
  const elementi: T[] = []
  let pagina = 0
  let totalePagine = 1
  while (pagina < totalePagine) {
    const { data } = await api.get<Pagina<T>>(url, { params: { page: pagina } })
    elementi.push(...data.contenuto)
    totalePagine = data.totalePagine
    pagina++
  }
  return elementi
}

export const elencoPreferiti = () => tutteLePagine<Preferito>('/preferiti')
export const elencoAvvisi = () => tutteLePagine<Avviso>('/avvisi')

export async function aggiungiPreferito(autoId: string): Promise<Preferito> {
  const { data } = await api.post<Preferito>('/preferiti', { autoId })
  return data
}

export async function rimuoviPreferito(preferitoId: string): Promise<void> {
  await api.delete(`/preferiti/${preferitoId}`)
}

export async function creaAvviso(preferitoId: string, soglia: number): Promise<Avviso> {
  const { data } = await api.post<Avviso>('/avvisi', { preferitoId, soglia })
  return data
}

export async function modificaAvviso(avvisoId: string, soglia: number): Promise<Avviso> {
  const { data } = await api.put<Avviso>(`/avvisi/${avvisoId}`, { soglia })
  return data
}

export async function eliminaAvviso(avvisoId: string): Promise<void> {
  await api.delete(`/avvisi/${avvisoId}`)
}
