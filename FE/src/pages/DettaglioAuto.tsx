import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { dettaglioAuto } from '../api/auto'
import { messaggioErrore } from '../api/client'
import type { AutoCard, AutoDettaglio } from '../api/types'
import { GalleriaAuto } from '../components/auto/GalleriaAuto'
import { BadgeStato, SpecificheAuto } from '../components/auto/PartiAuto'
import { SchedaTecnica } from '../components/auto/SchedaTecnica'
import CountUp from '../components/CountUp'
import { Icona } from '../components/Icona'
import { usePreferisceMenoAnimazioni } from '../utils/animazioni'
import { BoxAvviso } from '../preferiti/BoxAvviso'
import { usePreferiti } from '../preferiti/preferitiState'
import { formattaData, formattaPrezzo } from '../utils/formatta'

interface Risultato {
  id: string
  auto?: AutoDettaglio
  errore?: string
  nonTrovata?: boolean
}

// Rotta /auto/:id, linkata anche dalle mail degli avvisi di prezzo
export function DettaglioAuto() {
  const { id = '' } = useParams()
  const [risultato, setRisultato] = useState<Risultato | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    dettaglioAuto(id, controller.signal)
      .then((auto) => setRisultato({ id, auto }))
      .catch((err) => {
        if (controller.signal.aborted) return
        // 404 = inesistente o rimessa in bozza; 400 = id non valido nell'URL
        const status = axios.isAxiosError(err) ? err.response?.status : undefined
        setRisultato({ id, nonTrovata: status === 404 || status === 400, errore: messaggioErrore(err) })
      })
    return () => controller.abort()
  }, [id])

  if (risultato?.id !== id) return <Scheletro />

  if (!risultato.auto) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-notte-bordo dark:bg-notte-card">
        <Icona nome={risultato.nonTrovata ? 'car_crash' : 'error'} className="text-5xl text-slate-400" />
        <h1 className="text-xl font-bold">{risultato.nonTrovata ? 'Auto non disponibile' : 'Errore di caricamento'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {risultato.nonTrovata ? "L'annuncio non esiste o non è più pubblicato." : risultato.errore}
        </p>
        <Link to="/" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
          Torna alla vetrina
        </Link>
      </div>
    )
  }

  const auto = risultato.auto
  const titolo = `${auto.marca} ${auto.modello}`

  return (
    <div className="space-y-8">
      <nav aria-label="Percorso" className="flex items-center gap-2 text-sm">
        <Link to="/" className="flex items-center gap-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
          <Icona nome="arrow_back" className="text-base" />
          Vetrina
        </Link>
        <Icona nome="chevron_right" className="text-base text-slate-400" />
        <span aria-current="page" className="truncate font-semibold">
          {titolo}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <GalleriaAuto key={auto.id} immagini={auto.immagini} titolo={titolo} />

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-notte-bordo dark:bg-notte-card">
            <div className="space-y-3">
              <BadgeStato stato={auto.stato} />
              <h1 className="text-3xl font-bold tracking-tight">{titolo}</h1>
              <SpecificheAuto anno={auto.anno} carburante={auto.carburante} km={auto.km} className="gap-4" />
            </div>
            <div className="border-t border-slate-100 pt-5 dark:border-notte-bordo">
              <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Prezzo di vendita
              </p>
              <PrezzoAnimato prezzo={auto.prezzo} />
            </div>
            <AzioniPreferito auto={auto} />
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Annuncio pubblicato il {formattaData(auto.createdAt)}
            </p>
          </div>
        </aside>
      </div>

      {auto.descrizione && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-notte-bordo dark:bg-notte-card">
          <h2 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-bold dark:border-notte-bordo">
            <Icona nome="description" className="text-blue-600 dark:text-blue-400" />
            Descrizione del veicolo
          </h2>
          {/* Solo testo: la descrizione non viene mai interpretata come HTML */}
          <p className="max-w-4xl leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
            {auto.descrizione}
          </p>
        </section>
      )}

      <SchedaTecnica scheda={auto.schedaTecnica} vin={auto.vin} />
    </div>
  )
}

// Prezzo che "conta" da 0 fino al valore dell'auto (CountUp). Statico se le animazioni sono ridotte.
// I prezzi sono euro interi: si anima l'intero con separatore "." (stile it), poi il "€", come formattaPrezzo.
function PrezzoAnimato({ prezzo }: { prezzo: number }) {
  const ridotto = usePreferisceMenoAnimazioni()
  return (
    <p className="text-4xl font-extrabold">
      {/* Valore reale per gli screen reader; l'animazione è solo decorativa */}
      <span className="sr-only">{formattaPrezzo(prezzo)}</span>
      <span aria-hidden="true">
        {ridotto ? (
          formattaPrezzo(prezzo)
        ) : (
          <>
            <CountUp to={Math.round(prezzo)} from={0} separator="." duration={0.5} className="tabular-nums" /> €
          </>
        )}
      </span>
    </p>
  )
}

function Scheletro() {
  const blocco = 'animate-pulse rounded-xl bg-slate-200 dark:bg-notte-card'
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Caricamento">
      <div className={`${blocco} h-5 w-48`} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className={`${blocco} aspect-video`} />
        <div className={`${blocco} h-96`} />
      </div>
      <div className={`${blocco} h-48`} />
    </div>
  )
}

// Pulsante preferiti e, se l'auto e' salvata, box dell'avviso di prezzo (l'avviso si lega al preferito)
function AzioniPreferito({ auto }: { auto: AutoDettaglio }) {
  const { preferitoDi, inCorso, alternaPreferito } = usePreferiti()
  const preferito = preferitoDi(auto.id)
  const card: AutoCard = {
    id: auto.id,
    marca: auto.marca,
    modello: auto.modello,
    anno: auto.anno,
    carburante: auto.carburante,
    km: auto.km,
    prezzo: auto.prezzo,
    stato: auto.stato,
    immaginePrincipale: auto.immagini[0] ?? null,
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => void alternaPreferito(card)}
        disabled={inCorso(auto.id)}
        aria-pressed={preferito !== undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
          preferito
            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
            : 'border-slate-200 hover:bg-slate-50 dark:border-notte-bordo dark:hover:bg-notte-hover'
        }`}
      >
        <Icona nome="favorite" piena={preferito !== undefined} className="text-xl" />
        {preferito ? 'Nei preferiti' : 'Aggiungi ai preferiti'}
      </button>
      {preferito ? (
        <BoxAvviso preferito={preferito} />
      ) : (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Salvala nei preferiti per impostare un avviso di prezzo.
        </p>
      )}
    </div>
  )
}
