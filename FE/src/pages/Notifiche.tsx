import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { messaggioErrore } from '../api/client'
import { elencoNotifiche } from '../api/notifiche'
import type { Notifica, Pagina } from '../api/types'
import { Icona } from '../components/Icona'
import { Paginazione } from '../components/Paginazione'
import { useNotifiche } from '../notifiche/notificheState'

const formatoRelativo = new Intl.RelativeTimeFormat('it-IT', { numeric: 'auto' })
const formatoData = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// "2 ore fa", "ieri"; oltre una settimana la data completa
function quando(iso: string): string {
  const secondi = (new Date(iso).getTime() - Date.now()) / 1000
  const assoluti = Math.abs(secondi)
  if (assoluti < 60) return 'adesso'
  if (assoluti < 3600) return formatoRelativo.format(Math.round(secondi / 60), 'minute')
  if (assoluti < 86400) return formatoRelativo.format(Math.round(secondi / 3600), 'hour')
  if (assoluti < 7 * 86400) return formatoRelativo.format(Math.round(secondi / 86400), 'day')
  return formatoData.format(new Date(iso))
}

interface Risultato {
  chiave: string
  dati?: Pagina<Notifica>
  errore?: string
}

export function Notifiche() {
  const { nonLette, versione, segnaLetta, segnaTutteLette } = useNotifiche()
  const [soloNonLette, setSoloNonLette] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [risultato, setRisultato] = useState<Risultato | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  // Cambia dopo un'azione (segna letta) per ricaricare la pagina corrente
  const [aggiornamenti, setAggiornamenti] = useState(0)

  const chiave = `${soloNonLette}|${pagina}|${versione}|${aggiornamenti}`

  useEffect(() => {
    const controller = new AbortController()
    elencoNotifiche(pagina, soloNonLette, controller.signal)
      .then((dati) => setRisultato({ chiave, dati }))
      .catch((err) => {
        if (!controller.signal.aborted) setRisultato({ chiave, errore: messaggioErrore(err) })
      })
    return () => controller.abort()
    // "chiave" include anche le versioni: cambia quando serve ricaricare la stessa pagina
  }, [chiave, pagina, soloNonLette])

  // Durante un ricaricamento si continua a mostrare l'ultimo elenco, cosi' la lista non "salta"
  const dati = risultato?.dati
  const caricamento = risultato?.chiave !== chiave && !dati

  async function esegui(azione: () => Promise<void>) {
    setErrore(null)
    try {
      await azione()
      setAggiornamenti((a) => a + 1)
    } catch (err) {
      setErrore(messaggioErrore(err))
    }
  }

  function cambiaFiltro(nonLetteSole: boolean) {
    setSoloNonLette(nonLetteSole)
    setPagina(0)
  }

  const classeScheda = (attiva: boolean) =>
    `border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
      attiva
        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
    }`

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Notifiche</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {nonLette === 0 ? 'Nessuna notifica da leggere' : nonLette === 1 ? '1 non letta' : `${nonLette} non lette`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void esegui(segnaTutteLette)}
          disabled={nonLette === 0}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-notte-bordo dark:hover:bg-notte-hover"
        >
          <Icona nome="done_all" className="text-lg" />
          Segna tutte come lette
        </button>
      </div>

      <div className="flex gap-6 border-b border-slate-200 dark:border-notte-bordo" role="tablist" aria-label="Filtro notifiche">
        <button type="button" role="tab" aria-selected={!soloNonLette} onClick={() => cambiaFiltro(false)} className={classeScheda(!soloNonLette)}>
          Tutte
        </button>
        <button type="button" role="tab" aria-selected={soloNonLette} onClick={() => cambiaFiltro(true)} className={`${classeScheda(soloNonLette)} flex items-center gap-2`}>
          Non lette
          {nonLette > 0 && (
            <span className="rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white dark:bg-red-500">{nonLette}</span>
          )}
        </button>
      </div>

      {errore && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {errore}
        </p>
      )}

      {caricamento && <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-notte-card" aria-busy="true" />}

      {!dati && risultato?.errore && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {risultato.errore}
        </p>
      )}

      {dati && dati.contenuto.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-notte-bordo dark:bg-notte-card">
          <Icona nome="notifications_off" className="text-5xl text-slate-300 dark:text-slate-600" />
          <p className="font-semibold">{soloNonLette ? 'Hai letto tutto' : 'Ancora nessuna notifica'}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Imposta un avviso di prezzo su un'auto dei preferiti: ti avviseremo qui quando scende.
          </p>
        </div>
      )}

      {dati && dati.contenuto.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-notte-bordo dark:border-notte-bordo dark:bg-notte-card">
          {dati.contenuto.map((n) => (
            <li key={n.id} className={`flex gap-4 p-5 ${n.letta ? '' : 'bg-blue-50/60 dark:bg-blue-950/20'}`}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Icona nome="trending_down" className="text-xl" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className={n.letta ? 'text-slate-500 dark:text-slate-400' : 'font-medium'}>{n.messaggio}</p>
                <p className="flex flex-wrap items-center gap-x-3 text-sm">
                  <Link
                    to={`/auto/${n.autoId}`}
                    onClick={() => void segnaLetta(n).catch(() => undefined)}
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {n.marca} {n.modello}
                  </Link>
                  <time dateTime={n.createdAt} className="text-slate-500 dark:text-slate-400">
                    {quando(n.createdAt)}
                  </time>
                </p>
              </div>
              {!n.letta && (
                <div className="flex shrink-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => void esegui(() => segnaLetta(n))}
                    className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Segna come letta
                  </button>
                  <span className="mt-1.5 size-2.5 rounded-full bg-blue-600 dark:bg-blue-400">
                    <span className="sr-only">Non letta</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {dati && <Paginazione pagina={dati.pagina} totalePagine={dati.totalePagine} onCambia={setPagina} />}
    </div>
  )
}
