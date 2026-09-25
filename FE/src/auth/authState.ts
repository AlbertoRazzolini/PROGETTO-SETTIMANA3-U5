import { createContext, useContext } from 'react'
import type { LoginRequest, RegisterRequest, Utente } from '../api/types'

export interface AuthState {
  utente: Utente | null
  caricamento: boolean
  login: (credenziali: LoginRequest) => Promise<void>
  registra: (dati: RegisterRequest) => Promise<void>
  logout: () => void
  ricaricaUtente: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth va usato dentro <AuthProvider>')
  return ctx
}
