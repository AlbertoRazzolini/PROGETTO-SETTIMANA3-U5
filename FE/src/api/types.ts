// Tipi che rispecchiano i DTO del back-end (BE/src/main/java/com/example/be/dto)

export type Ruolo = 'USER' | 'ADMIN' | 'SUPER_ADMIN'
export type StatoAuto = 'NUOVO' | 'KM_0' | 'USATO'

export interface Pagina<T> {
  contenuto: T[]
  pagina: number
  dimensione: number
  totaleElementi: number
  totalePagine: number
}

export interface ErroreApi {
  timestamp: string
  status: number
  errore: string
  messaggio: string
  campi?: Record<string, string>
}

export interface Utente {
  id: string
  nome: string
  cognome: string
  email: string
  ruolo: Ruolo
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  utente: Utente
}

export interface RegisterRequest {
  nome: string
  cognome: string
  email: string
  password: string
}

export interface AutoCard {
  id: string
  marca: string
  modello: string
  anno: number
  carburante: string
  km: number
  prezzo: number
  stato: StatoAuto
  immaginePrincipale: string | null
}

export interface AutoDettaglio {
  id: string
  vin: string
  marca: string
  modello: string
  anno: number
  carburante: string
  descrizione: string | null
  schedaTecnica: Record<string, unknown> | null
  immagini: string[]
  km: number
  prezzo: number
  stato: StatoAuto
  createdAt: string
}

export interface Preferito {
  id: string
  createdAt: string
  // false se l'admin ha rimesso l'annuncio in bozza dopo il salvataggio
  disponibile: boolean
  auto: AutoCard
}

export interface Avviso {
  id: string
  preferitoId: string
  soglia: number
  attivo: boolean
  // true se per la soglia attuale la mail e' gia' stata inviata
  notificato: boolean
  createdAt: string
  updatedAt: string
  auto: AutoCard
}

export interface Notifica {
  id: string
  messaggio: string
  letta: boolean
  createdAt: string
  autoId: string
  marca: string
  modello: string
}

export type StatoPubblicazione = 'BOZZA' | 'PUBBLICATO'

// Vista admin: comprende le bozze, che possono avere campi ancora vuoti
export interface AutoAdmin {
  id: string
  listingId: string | null
  vin: string
  marca: string
  modello: string
  anno: number
  carburante: string
  descrizione: string | null
  schedaTecnica: Record<string, unknown> | null
  immagini: string[]
  km: number | null
  prezzo: number | null
  stato: StatoAuto | null
  statoPubblicazione: StatoPubblicazione
  createdAt: string
  updatedAt: string
}

// PUT dei dettagli: il prezzo non c'e', si cambia solo con aggiornaPrezzo
export interface AutoUpdate {
  km: number
  stato: StatoAuto
  descrizione: string
}

export interface AnnuncioAutoDev {
  listingId: string
  marca: string
  modello: string
  anno: number
  carburante: string | null
  prezzoUsd: number | null
  miglia: number | null
  usato: boolean | null
  immaginePrincipale: string | null
}

export interface AnteprimaAnnuncio {
  listingId: string
  vin: string
  marca: string
  modello: string
  anno: number
  carburante: string | null
  prezzoUsd: number | null
  prezzoEur: number | null
  km: number | null
  statoSuggerito: StatoAuto | null
  venditore: string | null
  descrizione: string | null
  schedaTecnica: Record<string, unknown> | null
  foto: string[]
}
