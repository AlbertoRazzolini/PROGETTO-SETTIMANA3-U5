import { createContext, useContext } from 'react'
import type { Avviso, AutoCard, Preferito } from '../api/types'

export interface PreferitiState {
  // null finche' l'elenco non e' caricato (o se l'utente non e' loggato)
  preferiti: Preferito[] | null
  avvisi: Avviso[]
  preferitoDi: (autoId: string) => Preferito | undefined
  avvisoDi: (preferitoId: string) => Avviso | undefined
  inCorso: (autoId: string) => boolean
  // Aggiunge o toglie dai preferiti; senza login porta alla pagina di accesso
  alternaPreferito: (auto: AutoCard) => Promise<void>
  rimuovi: (preferito: Preferito) => Promise<void>
  // Crea l'avviso o, se esiste gia', ne cambia la soglia. Rilancia l'errore per il form che lo mostra.
  salvaAvviso: (preferitoId: string, soglia: number) => Promise<void>
  eliminaAvviso: (avviso: Avviso) => Promise<void>
  // Ultimo errore di un'azione rapida (cuore, rimozione), mostrato come messaggio a comparsa
  errore: string | null
  // Riallinea preferiti e avvisi col server (es. dopo una notifica di prezzo cambiato)
  ricarica: () => void
  chiudiErrore: () => void
}

export const PreferitiContext = createContext<PreferitiState | null>(null)

export function usePreferiti(): PreferitiState {
  const ctx = useContext(PreferitiContext)
  if (!ctx) throw new Error('usePreferiti va usato dentro <PreferitiProvider>')
  return ctx
}
