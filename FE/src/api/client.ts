import axios, { AxiosError } from 'axios'
import type { ErroreApi } from './types'

const CHIAVE_TOKEN = 'salone.token'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export function leggiToken(): string | null {
  try {
    return localStorage.getItem(CHIAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvaToken(token: string | null) {
  try {
    if (token) localStorage.setItem(CHIAVE_TOKEN, token)
    else localStorage.removeItem(CHIAVE_TOKEN)
  } catch {
    // storage non disponibile (es. navigazione privata): il token resta solo in memoria
  }
}

export const api = axios.create({ baseURL: `${API_URL}/api` })

// Aggiunge il JWT a ogni richiesta, se presente
api.interceptors.request.use((config) => {
  const token = leggiToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Chi gestisce la sessione (AuthContext) si registra qui per sapere quando il token non e' piu' valido
let alScadereSessione: (() => void) | null = null
export function onSessioneScaduta(callback: (() => void) | null) {
  alScadereSessione = callback
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && leggiToken()) {
      salvaToken(null)
      alScadereSessione?.()
    }
    return Promise.reject(error)
  },
)

// Estrae il messaggio leggibile dal formato errore del BE
export function messaggioErrore(error: unknown): string {
  if (axios.isAxiosError<ErroreApi>(error)) {
    if (error.response?.data?.messaggio) return error.response.data.messaggio
    if (!error.response) return 'Server non raggiungibile'
  }
  return 'Si e\' verificato un errore imprevisto'
}

// Errori di validazione per campo (campo -> messaggio), se presenti
export function erroriCampi(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ErroreApi>(error)) return error.response?.data?.campi ?? {}
  return {}
}
