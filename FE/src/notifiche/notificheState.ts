import { createContext, useContext } from 'react'
import type { Notifica } from '../api/types'

export interface NotificheState {
  // Notifiche non lette (badge del campanello); 0 se non loggati
  nonLette: number
  // Arrivate in tempo reale e non ancora chiuse: mostrate come messaggi a comparsa
  arrivate: Notifica[]
  chiudiArrivata: (id: string) => void
  // Cresce a ogni notifica in tempo reale: la pagina Notifiche la usa per ricaricare l'elenco
  versione: number
  segnaLetta: (notifica: Notifica) => Promise<void>
  segnaTutteLette: () => Promise<void>
}

export const NotificheContext = createContext<NotificheState | null>(null)

export function useNotifiche(): NotificheState {
  const ctx = useContext(NotificheContext)
  if (!ctx) throw new Error('useNotifiche va usato dentro <NotificheProvider>')
  return ctx
}
