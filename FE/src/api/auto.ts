import { api } from './client'
import type { AutoCard, Pagina, StatoAuto } from './types'

export interface FiltriAuto {
  q?: string
  stato?: StatoAuto
  carburante?: string
  prezzoMin?: number
  prezzoMax?: number
  page?: number
  // "campo" o "campo,asc|desc" con campo tra prezzo, km, anno, marca, data
  sort?: string
}

// Stessi valori del dizionario CARBURANTI del BE (AutoDevService): il filtro confronta il testo esatto
export const CARBURANTI = [
  'Benzina',
  'Diesel',
  'Ibrida',
  'Ibrida plug-in',
  'Elettrica',
  'GPL',
  'Metano',
  'Idrogeno',
  'Flex Fuel (E85)',
] as const

export const ORDINAMENTI = [
  { valore: '', etichetta: 'Più recenti' },
  { valore: 'prezzo,asc', etichetta: 'Prezzo crescente' },
  { valore: 'prezzo,desc', etichetta: 'Prezzo decrescente' },
  { valore: 'km,asc', etichetta: 'Km crescenti' },
  { valore: 'anno,desc', etichetta: 'Anno più recente' },
  { valore: 'marca,asc', etichetta: 'Marca A-Z' },
] as const

export async function cercaAuto(filtri: FiltriAuto, signal?: AbortSignal): Promise<Pagina<AutoCard>> {
  const { data } = await api.get<Pagina<AutoCard>>('/auto', { params: filtri, signal })
  return data
}

// Il BE risponde solo dalla 3a lettera in poi
export const MIN_LETTERE_SUGGERIMENTI = 3

export async function suggerimentiAuto(q: string, signal?: AbortSignal): Promise<string[]> {
  const { data } = await api.get<string[]>('/auto/suggerimenti', { params: { q }, signal })
  return data
}
