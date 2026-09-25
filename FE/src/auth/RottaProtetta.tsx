import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Ruolo } from '../api/types'
import { useAuth } from './authState'

// Protegge una rotta: senza login rimanda a /login, con ruolo non ammesso rimanda alla vetrina.
// E' solo UX: l'autorizzazione vera la fa il BE su ogni richiesta.
export function RottaProtetta({ ruoli, children }: { ruoli?: Ruolo[]; children: ReactNode }) {
  const { utente, caricamento } = useAuth()
  const location = useLocation()

  if (caricamento) return null
  if (!utente) return <Navigate to="/login" replace state={{ da: location.pathname }} />
  if (ruoli && !ruoli.includes(utente.ruolo)) return <Navigate to="/" replace />
  return children
}
