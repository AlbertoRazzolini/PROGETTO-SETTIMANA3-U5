import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, leggiToken, onSessioneScaduta, salvaToken } from '../api/client'
import type { LoginRequest, LoginResponse, RegisterRequest, Utente } from '../api/types'
import { AuthContext, type AuthState } from './authState'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<Utente | null>(null)
  // Finche' non sappiamo se il token salvato e' valido, le rotte protette aspettano
  const [caricamento, setCaricamento] = useState(() => leggiToken() !== null)

  // Il ruolo va sempre letto da /utenti/me: il super-admin puo' cambiarlo dopo il login
  const ricaricaUtente = useCallback(async () => {
    const { data } = await api.get<Utente>('/utenti/me')
    setUtente(data)
  }, [])

  useEffect(() => {
    onSessioneScaduta(() => setUtente(null))
    if (leggiToken()) {
      api
        .get<Utente>('/utenti/me')
        .then(({ data }) => setUtente(data))
        .catch(() => salvaToken(null))
        .finally(() => setCaricamento(false))
    }
    return () => onSessioneScaduta(null)
  }, [])

  const login = useCallback(async (credenziali: LoginRequest) => {
    const { data } = await api.post<LoginResponse>('/auth/login', credenziali)
    salvaToken(data.token)
    setUtente(data.utente)
  }, [])

  const registra = useCallback(async (dati: RegisterRequest) => {
    await api.post<Utente>('/auth/register', dati)
  }, [])

  const logout = useCallback(() => {
    salvaToken(null)
    setUtente(null)
  }, [])

  const valore = useMemo<AuthState>(
    () => ({ utente, caricamento, login, registra, logout, ricaricaUtente }),
    [utente, caricamento, login, registra, logout, ricaricaUtente],
  )

  return <AuthContext value={valore}>{children}</AuthContext>
}
