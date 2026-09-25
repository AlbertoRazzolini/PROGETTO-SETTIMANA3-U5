import { api } from './client'
import type {
  AnnuncioAutoDev,
  AnteprimaAnnuncio,
  AutoAdmin,
  AutoUpdate,
  Pagina,
  Ruolo,
  StatoPubblicazione,
  Utente,
} from './types'

// ---- Annunci (ADMIN e SUPER_ADMIN) ----

export interface FiltriAdmin {
  stato?: StatoPubblicazione
  page?: number
  sort?: string
}

export async function elencoAutoAdmin(filtri: FiltriAdmin, signal?: AbortSignal): Promise<Pagina<AutoAdmin>> {
  const { data } = await api.get<Pagina<AutoAdmin>>('/admin/auto', { params: { ...filtri, size: 10 }, signal })
  return data
}

export async function aggiornaAuto(id: string, dati: AutoUpdate): Promise<AutoAdmin> {
  const { data } = await api.put<AutoAdmin>(`/admin/auto/${id}`, dati)
  return data
}

// Unico modo per cambiare il prezzo: il BE ricontrolla gli avvisi degli utenti
export async function aggiornaPrezzo(id: string, prezzo: number): Promise<AutoAdmin> {
  const { data } = await api.patch<AutoAdmin>(`/admin/auto/${id}/prezzo`, { prezzo })
  return data
}

export async function pubblicaAuto(id: string): Promise<AutoAdmin> {
  const { data } = await api.patch<AutoAdmin>(`/admin/auto/${id}/pubblica`)
  return data
}

export async function mettiInBozza(id: string): Promise<AutoAdmin> {
  const { data } = await api.patch<AutoAdmin>(`/admin/auto/${id}/bozza`)
  return data
}

// ---- Import da auto.dev: ogni chiamata consuma crediti ----

// page parte da 1 (come su auto.dev); ogni pagina costa 1 chiamata
export async function cercaAnnunciAutoDev(make: string, model: string, limit: number, page: number): Promise<AnnuncioAutoDev[]> {
  const { data } = await api.get<AnnuncioAutoDev[]>('/admin/autodev/listings', {
    params: { make: make || undefined, model: model || undefined, limit, page },
  })
  return data
}

export async function anteprimaAnnuncio(listingId: string): Promise<AnteprimaAnnuncio> {
  const { data } = await api.get<AnteprimaAnnuncio>(`/admin/autodev/listings/${encodeURIComponent(listingId)}`)
  return data
}

export async function importaAnnuncio(listingId: string): Promise<AutoAdmin> {
  const { data } = await api.post<AutoAdmin>('/admin/auto/import', { listingId })
  return data
}

// ---- Utenti (solo SUPER_ADMIN) ----

export async function elencoUtenti(ruolo: Ruolo | undefined, page: number, signal?: AbortSignal): Promise<Pagina<Utente>> {
  const { data } = await api.get<Pagina<Utente>>('/superadmin/utenti', { params: { ruolo, page }, signal })
  return data
}

export async function cambiaRuolo(id: string, ruolo: Ruolo): Promise<Utente> {
  const { data } = await api.patch<Utente>(`/superadmin/utenti/${id}/ruolo`, { ruolo })
  return data
}
