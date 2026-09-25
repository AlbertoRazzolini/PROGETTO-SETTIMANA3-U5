import { Client } from '@stomp/stompjs'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { API_URL, leggiToken } from '../api/client'
import * as apiNotifiche from '../api/notifiche'
import type { Notifica } from '../api/types'
import { useAuth } from '../auth/authState'
import { usePreferiti } from '../preferiti/preferitiState'
import { NotificheContext, type NotificheState } from './notificheState'

// ws://localhost:8080/ws (wss:// se il BE e' in https)
const URL_WS = `${API_URL.replace(/^http/, 'ws')}/ws`
const CODA = '/user/queue/notifiche'
const MAX_A_COMPARSA = 3

interface Conteggio {
  utenteId: string
  valore: number
}

export function NotificheProvider({ children }: { children: ReactNode }) {
  const { utente } = useAuth()
  const { ricarica: ricaricaPreferiti } = usePreferiti()
  const [conteggio, setConteggio] = useState<Conteggio | null>(null)
  const [arrivate, setArrivate] = useState<Notifica[]>([])
  const [versione, setVersione] = useState(0)

  const utenteId = utente?.id

  // Connessione STOMP finche' l'utente e' loggato: JWT nel frame CONNECT, coda personale
  useEffect(() => {
    if (!utenteId) return
    const token = leggiToken()
    if (!token) return

    const aggiornaConteggio = () => {
      apiNotifiche
        .conteggioNonLette()
        .then((valore) => setConteggio({ utenteId, valore }))
        .catch(() => {
          // il badge resta com'era: non blocca la navigazione
        })
    }

    const client = new Client({
      brokerURL: URL_WS,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // Anche a ogni riconnessione: nel frattempo potrebbero essere arrivate notifiche
        aggiornaConteggio()
        client.subscribe(CODA, (messaggio) => {
          const notifica = JSON.parse(messaggio.body) as Notifica
          setConteggio((c) => (c && c.utenteId === utenteId ? { ...c, valore: c.valore + 1 } : c))
          setArrivate((a) => [notifica, ...a.filter((n) => n.id !== notifica.id)].slice(0, MAX_A_COMPARSA))
          setVersione((v) => v + 1)
          // La notifica nasce da un cambio di prezzo: prezzi e stati degli avvisi nei preferiti sono cambiati
          ricaricaPreferiti()
        })
      },
    })
    client.activate()
    return () => {
      void client.deactivate()
      setArrivate([])
    }
  }, [utenteId, ricaricaPreferiti])

  const nonLette = conteggio && conteggio.utenteId === utenteId ? conteggio.valore : 0

  const chiudiArrivata = useCallback((id: string) => {
    setArrivate((a) => a.filter((n) => n.id !== id))
  }, [])

  const segnaLetta = useCallback(async (notifica: Notifica) => {
    if (notifica.letta) return
    await apiNotifiche.segnaLetta(notifica.id)
    setConteggio((c) => (c ? { ...c, valore: Math.max(0, c.valore - 1) } : c))
    setArrivate((a) => a.filter((n) => n.id !== notifica.id))
  }, [])

  const segnaTutteLette = useCallback(async () => {
    await apiNotifiche.segnaTutteLette()
    setConteggio((c) => (c ? { ...c, valore: 0 } : c))
    setArrivate([])
  }, [])

  const valore = useMemo<NotificheState>(
    () => ({ nonLette, arrivate, chiudiArrivata, versione, segnaLetta, segnaTutteLette }),
    [nonLette, arrivate, chiudiArrivata, versione, segnaLetta, segnaTutteLette],
  )

  return <NotificheContext value={valore}>{children}</NotificheContext>
}
