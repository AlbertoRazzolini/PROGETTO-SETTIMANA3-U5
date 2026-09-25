import axios from 'axios'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { messaggioErrore } from '../api/client'
import * as apiPreferiti from '../api/preferiti'
import type { AutoCard, Avviso, Preferito } from '../api/types'
import { useAuth } from '../auth/authState'
import { PreferitiContext, type PreferitiState } from './preferitiState'

interface Dati {
  utenteId: string
  preferiti: Preferito[]
  avvisi: Avviso[]
}

const stato = (err: unknown) => (axios.isAxiosError(err) ? err.response?.status : undefined)

export function PreferitiProvider({ children }: { children: ReactNode }) {
  const { utente } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dati, setDati] = useState<Dati | null>(null)
  const [versione, setVersione] = useState(0)
  const [autoInCorso, setAutoInCorso] = useState<ReadonlySet<string>>(new Set())
  const [errore, setErrore] = useState<string | null>(null)

  const utenteId = utente?.id

  // Caricamento completo a ogni login (e quando serve riallinearsi col server: "versione")
  useEffect(() => {
    if (!utenteId) return
    let annullato = false
    Promise.all([apiPreferiti.elencoPreferiti(), apiPreferiti.elencoAvvisi()])
      .then(([preferiti, avvisi]) => {
        if (!annullato) setDati({ utenteId, preferiti, avvisi })
      })
      .catch((err) => {
        if (!annullato) setErrore(messaggioErrore(err))
      })
    return () => {
      annullato = true
    }
  }, [utenteId, versione])

  // I dati di un utente precedente (dopo logout o cambio account) non vengono mai mostrati
  const correnti = dati && dati.utenteId === utenteId ? dati : null
  const ricarica = useCallback(() => setVersione((v) => v + 1), [])

  const aggiorna = useCallback((modifica: (d: Dati) => Dati) => {
    setDati((d) => (d ? modifica(d) : d))
  }, [])

  const segnaInCorso = useCallback((autoId: string, attivo: boolean) => {
    setAutoInCorso((s) => {
      const nuovo = new Set(s)
      if (attivo) nuovo.add(autoId)
      else nuovo.delete(autoId)
      return nuovo
    })
  }, [])

  const rimuovi = useCallback(
    async (preferito: Preferito) => {
      segnaInCorso(preferito.auto.id, true)
      try {
        await apiPreferiti.rimuoviPreferito(preferito.id)
        // Il BE cancella anche l'avviso collegato (ON DELETE CASCADE)
        aggiorna((d) => ({
          ...d,
          preferiti: d.preferiti.filter((p) => p.id !== preferito.id),
          avvisi: d.avvisi.filter((a) => a.preferitoId !== preferito.id),
        }))
      } catch (err) {
        if (stato(err) === 404) ricarica()
        else setErrore(messaggioErrore(err))
      } finally {
        segnaInCorso(preferito.auto.id, false)
      }
    },
    [aggiorna, ricarica, segnaInCorso],
  )

  const alternaPreferito = useCallback(
    async (auto: AutoCard) => {
      if (!utenteId) {
        navigate('/login', { state: { da: location.pathname + location.search } })
        return
      }
      const esistente = correnti?.preferiti.find((p) => p.auto.id === auto.id)
      if (esistente) {
        await rimuovi(esistente)
        return
      }
      segnaInCorso(auto.id, true)
      try {
        const nuovo = await apiPreferiti.aggiungiPreferito(auto.id)
        aggiorna((d) => ({ ...d, preferiti: [nuovo, ...d.preferiti] }))
      } catch (err) {
        // 409: era gia' salvato (es. da un'altra scheda del browser) -> ci si riallinea col server
        if (stato(err) === 409) ricarica()
        else setErrore(messaggioErrore(err))
      } finally {
        segnaInCorso(auto.id, false)
      }
    },
    [utenteId, correnti, navigate, location, rimuovi, segnaInCorso, aggiorna, ricarica],
  )

  const salvaAvviso = useCallback(
    async (preferitoId: string, soglia: number) => {
      const esistente = correnti?.avvisi.find((a) => a.preferitoId === preferitoId)
      const salvato = esistente
        ? await apiPreferiti.modificaAvviso(esistente.id, soglia)
        : await apiPreferiti.creaAvviso(preferitoId, soglia)
      aggiorna((d) => ({
        ...d,
        avvisi: [salvato, ...d.avvisi.filter((a) => a.id !== salvato.id)],
      }))
    },
    [correnti, aggiorna],
  )

  const eliminaAvviso = useCallback(
    async (avviso: Avviso) => {
      try {
        await apiPreferiti.eliminaAvviso(avviso.id)
        aggiorna((d) => ({ ...d, avvisi: d.avvisi.filter((a) => a.id !== avviso.id) }))
      } catch (err) {
        if (stato(err) === 404) ricarica()
        else setErrore(messaggioErrore(err))
      }
    },
    [aggiorna, ricarica],
  )

  const valore = useMemo<PreferitiState>(
    () => ({
      preferiti: correnti?.preferiti ?? null,
      avvisi: correnti?.avvisi ?? [],
      preferitoDi: (autoId) => correnti?.preferiti.find((p) => p.auto.id === autoId),
      avvisoDi: (preferitoId) => correnti?.avvisi.find((a) => a.preferitoId === preferitoId),
      inCorso: (autoId) => autoInCorso.has(autoId),
      alternaPreferito,
      rimuovi,
      salvaAvviso,
      eliminaAvviso,
      errore,
      chiudiErrore: () => setErrore(null),
      ricarica,
    }),
    [correnti, autoInCorso, alternaPreferito, rimuovi, salvaAvviso, eliminaAvviso, errore, ricarica],
  )

  return <PreferitiContext value={valore}>{children}</PreferitiContext>
}
