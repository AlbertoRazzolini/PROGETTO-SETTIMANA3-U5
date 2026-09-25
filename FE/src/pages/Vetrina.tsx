import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { cercaAuto, ORDINAMENTI, type FiltriAuto } from '../api/auto'
import { messaggioErrore } from '../api/client'
import { usePreferiti } from '../preferiti/preferitiState'
import type { AutoCard, Pagina, StatoAuto } from '../api/types'
import { CardAuto } from '../components/auto/CardAuto'
import { CardAutoEvidenza } from '../components/auto/CardAutoEvidenza'
import { Icona } from '../components/Icona'
import { Paginazione } from '../components/Paginazione'
import { BarraRicerca } from '../components/vetrina/BarraRicerca'
import { FiltriVetrina, type ValoriFiltri } from '../components/vetrina/FiltriVetrina'

const STATI_VALIDI: StatoAuto[] = ['NUOVO', 'KM_0', 'USATO']
const SORT_VALIDI: string[] = ORDINAMENTI.map((o) => o.valore)

// I filtri vivono nell'URL (?q=...&stato=...&page=...): link condivisibili e tasto indietro funzionante.
// Valori non validi scritti a mano nell'URL vengono ignorati invece di mandare in errore la pagina.
function leggiFiltri(params: URLSearchParams): FiltriAuto {
  const numero = (nome: string) => {
    const v = params.get(nome)
    const n = v === null || v === '' ? NaN : Number(v)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }
  const stato = params.get('stato') as StatoAuto | null
  const sort = params.get('sort') ?? ''
  const page = numero('page')
  return {
    q: params.get('q')?.trim() || undefined,
    stato: stato && STATI_VALIDI.includes(stato) ? stato : undefined,
    carburante: params.get('carburante') || undefined,
    prezzoMin: numero('prezzoMin'),
    prezzoMax: numero('prezzoMax'),
    page: page !== undefined ? Math.floor(page) : undefined,
    sort: sort && SORT_VALIDI.includes(sort) ? sort : undefined,
  }
}

function scriviFiltri(filtri: FiltriAuto): URLSearchParams {
  const params = new URLSearchParams()
  Object.entries(filtri).forEach(([chiave, valore]) => {
    if (valore !== undefined && valore !== '' && !(chiave === 'page' && valore === 0)) {
      params.set(chiave, String(valore))
    }
  })
  return params
}

interface Risultato {
  chiave: string
  dati?: Pagina<AutoCard>
  errore?: string
}

export function Vetrina() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filtri = useMemo(() => leggiFiltri(searchParams), [searchParams])
  const chiave = scriviFiltri(filtri).toString()

  const [risultato, setRisultato] = useState<Risultato | null>(null)
  const { preferitoDi, inCorso, alternaPreferito } = usePreferiti()
  const propsPreferito = (auto: AutoCard) => ({
    preferito: preferitoDi(auto.id) !== undefined,
    inCorso: inCorso(auto.id),
    onPreferito: () => void alternaPreferito(auto),
  })

  useEffect(() => {
    const controller = new AbortController()
    // si rilegge dalla chiave (e non da "filtri") cosi' l'effetto dipende solo da una stringa stabile
    cercaAuto(leggiFiltri(new URLSearchParams(chiave)), controller.signal)
      .then((dati) => setRisultato({ chiave, dati }))
      .catch((err) => {
        if (!controller.signal.aborted) setRisultato({ chiave, errore: messaggioErrore(err) })
      })
    return () => controller.abort()
  }, [chiave])

  // Finche' non arriva la risposta per i filtri attuali si mostra il caricamento
  const caricamento = risultato?.chiave !== chiave
  const pagina = caricamento ? undefined : risultato?.dati
  const errore = caricamento ? undefined : risultato?.errore

  function aggiornaFiltri(modifiche: Partial<FiltriAuto>, tornaAllaPrima = true) {
    const nuovi = { ...filtri, ...modifiche }
    if (tornaAllaPrima) nuovi.page = undefined
    setSearchParams(scriviFiltri(nuovi))
  }

  function cambiaPagina(nuova: number) {
    aggiornaFiltri({ page: nuova }, false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function applicaFiltri(v: ValoriFiltri) {
    aggiornaFiltri({
      stato: v.stato || undefined,
      carburante: v.carburante || undefined,
      prezzoMin: v.prezzoMin === '' ? undefined : Number(v.prezzoMin),
      prezzoMax: v.prezzoMax === '' ? undefined : Number(v.prezzoMax),
    })
  }

  const valoriFiltri: ValoriFiltri = {
    stato: filtri.stato ?? '',
    carburante: filtri.carburante ?? '',
    prezzoMin: filtri.prezzoMin?.toString() ?? '',
    prezzoMax: filtri.prezzoMax?.toString() ?? '',
  }

  const [evidenza, ...altre] = pagina?.contenuto ?? []

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-notte-bordo dark:bg-notte-card">
        <div className="mx-auto max-w-4xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vetrina veicoli disponibili</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Le migliori offerte su vetture nuove, km 0 e usate.
            </p>
          </div>
          <BarraRicerca key={filtri.q ?? ''} valoreIniziale={filtri.q ?? ''} onCerca={(q) => aggiornaFiltri({ q: q || undefined })} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <FiltriVetrina
            key={JSON.stringify(valoriFiltri)}
            iniziali={valoriFiltri}
            onApplica={applicaFiltri}
            onAzzera={() => setSearchParams(new URLSearchParams())}
          />
        </aside>

        <section className="min-w-0 space-y-6" aria-busy={caricamento}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-notte-bordo dark:bg-notte-card">
            <p className="text-sm font-semibold" aria-live="polite">
              {caricamento ? 'Ricerca in corso...' : pagina ? pagina.totaleElementi === 1 ? '1 auto trovata' : `${pagina.totaleElementi} auto trovate` : ''}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Ordina per</span>
              <select
                value={filtri.sort ?? ''}
                onChange={(e) => aggiornaFiltri({ sort: e.target.value || undefined })}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold outline-none focus:border-blue-500 dark:border-notte-bordo dark:bg-notte-sfondo"
              >
                {ORDINAMENTI.map((o) => (
                  <option key={o.valore} value={o.valore}>
                    {o.etichetta}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {caricamento && <ScheletroGriglia />}

          {errore && (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <Icona nome="error" className="text-4xl" />
              <p className="font-semibold">{errore}</p>
            </div>
          )}

          {pagina && pagina.contenuto.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-notte-bordo dark:bg-notte-card">
              <Icona nome="search_off" className="text-5xl text-slate-400" />
              <p className="text-lg font-semibold">Nessuna auto trovata</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Prova a modificare la ricerca o ad azzerare i filtri.</p>
            </div>
          )}

          {evidenza && (
            <>
              <CardAutoEvidenza auto={evidenza} {...propsPreferito(evidenza)} />
              {altre.length > 0 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {altre.map((auto) => (
                    <CardAuto key={auto.id} auto={auto} {...propsPreferito(auto)} />
                  ))}
                </div>
              )}
            </>
          )}

          {pagina && (
            <Paginazione pagina={pagina.pagina} totalePagine={pagina.totalePagine} onCambia={cambiaPagina} />
          )}
        </section>
      </div>
    </div>
  )
}

function ScheletroGriglia() {
  const blocco = 'animate-pulse rounded-xl bg-slate-200 dark:bg-notte-card'
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className={`${blocco} h-[300px]`} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={`${blocco} h-80`} />
        ))}
      </div>
    </div>
  )
}
