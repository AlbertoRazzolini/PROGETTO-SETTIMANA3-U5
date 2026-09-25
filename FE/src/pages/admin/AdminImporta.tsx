import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { anteprimaAnnuncio, cercaAnnunciAutoDev, importaAnnuncio } from '../../api/admin'
import { messaggioErrore } from '../../api/client'
import type { AnnuncioAutoDev, AnteprimaAnnuncio } from '../../api/types'
import { GalleriaAuto } from '../../components/auto/GalleriaAuto'
import { BadgeStato, ImmagineAuto } from '../../components/auto/PartiAuto'
import { SchedaTecnica } from '../../components/auto/SchedaTecnica'
import { Icona } from '../../components/Icona'
import { formattaKm, formattaPrezzo } from '../../utils/formatta'

// Stessa regola del BE (AutoDevAdminController.REGEX_TESTO_FILTRO); campo vuoto = filtro non usato
const TESTO_FILTRO = /^[\p{L}\p{N} .-]{0,40}$/u
// 20 e' il massimo del piano Free di auto.dev; il numero di risultati non cambia il costo (1 chiamata per pagina)
const LIMITI = [5, 10, 20]
const PAGINA_MAX = 100

const formatoUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const formatoMiglia = new Intl.NumberFormat('it-IT')

const classeCampo =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-notte-bordo dark:bg-notte-sfondo'

interface Ricerca {
  marca: string
  modello: string
  limite: number
  pagina: number
}

// Esito dell'import per annuncio: in corso, riuscito o messaggio d'errore del BE
type EsitoImport = { tipo: 'inCorso' } | { tipo: 'ok' } | { tipo: 'errore'; messaggio: string }

export function AdminImporta() {
  const [marca, setMarca] = useState('')
  const [modello, setModello] = useState('')
  const [limite, setLimite] = useState(20)
  // Filtri dell'ultima ricerca: le pagine successive usano questi, non quelli nei campi
  const [ricerca, setRicerca] = useState<Ricerca | null>(null)
  const [risultati, setRisultati] = useState<AnnuncioAutoDev[] | null>(null)
  const [cercando, setCercando] = useState(false)
  const [erroreRicerca, setErroreRicerca] = useState<string | null>(null)

  const [selezionato, setSelezionato] = useState<string | null>(null)
  // Ultima riga scelta: le risposte di anteprime precedenti vengono scartate
  const ultimaScelta = useRef<string | null>(null)
  const [anteprima, setAnteprima] = useState<AnteprimaAnnuncio | null>(null)
  const [caricaAnteprima, setCaricaAnteprima] = useState(false)
  const [erroreAnteprima, setErroreAnteprima] = useState<string | null>(null)

  const [scelti, setScelti] = useState<ReadonlySet<string>>(new Set())
  const [esiti, setEsiti] = useState<Record<string, EsitoImport>>({})
  const [importoMultiplo, setImportoMultiplo] = useState(false)

  async function eseguiRicerca(nuova: Ricerca) {
    setCercando(true)
    setErroreRicerca(null)
    setSelezionato(null)
    ultimaScelta.current = null
    setAnteprima(null)
    setErroreAnteprima(null)
    setScelti(new Set())
    try {
      setRisultati(await cercaAnnunciAutoDev(nuova.marca, nuova.modello, nuova.limite, nuova.pagina))
      setRicerca(nuova)
    } catch (err) {
      setErroreRicerca(messaggioErrore(err))
    } finally {
      setCercando(false)
    }
  }

  function onCerca(e: FormEvent) {
    e.preventDefault()
    if (!TESTO_FILTRO.test(marca.trim()) || !TESTO_FILTRO.test(modello.trim())) {
      setErroreRicerca('Marca e modello possono contenere solo lettere, numeri, spazi, punti e trattini')
      return
    }
    void eseguiRicerca({ marca: marca.trim(), modello: modello.trim(), limite, pagina: 1 })
  }

  function cambiaPagina(delta: number) {
    if (!ricerca) return
    void eseguiRicerca({ ...ricerca, pagina: ricerca.pagina + delta })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function apri(listingId: string) {
    setSelezionato(listingId)
    ultimaScelta.current = listingId
    setAnteprima(null)
    setErroreAnteprima(null)
    setCaricaAnteprima(true)
    try {
      const dati = await anteprimaAnnuncio(listingId)
      if (ultimaScelta.current === listingId) setAnteprima(dati)
    } catch (err) {
      if (ultimaScelta.current === listingId) setErroreAnteprima(messaggioErrore(err))
    } finally {
      if (ultimaScelta.current === listingId) setCaricaAnteprima(false)
    }
  }

  async function importaUno(listingId: string) {
    setEsiti((e) => ({ ...e, [listingId]: { tipo: 'inCorso' } }))
    try {
      await importaAnnuncio(listingId)
      setEsiti((e) => ({ ...e, [listingId]: { tipo: 'ok' } }))
    } catch (err) {
      setEsiti((e) => ({ ...e, [listingId]: { tipo: 'errore', messaggio: messaggioErrore(err) } }))
    }
  }

  // Uno alla volta: il BE chiama auto.dev per ciascuno e cosi' l'avanzamento si vede riga per riga
  async function importaScelti() {
    setImportoMultiplo(true)
    for (const listingId of scelti) {
      if (esiti[listingId]?.tipo !== 'ok') await importaUno(listingId)
    }
    setScelti(new Set())
    setImportoMultiplo(false)
  }

  function alternaScelta(listingId: string) {
    setScelti((s) => {
      const nuovo = new Set(s)
      if (nuovo.has(listingId)) nuovo.delete(listingId)
      else nuovo.add(listingId)
      return nuovo
    })
  }

  const importabili = risultati?.filter((r) => esiti[r.listingId]?.tipo !== 'ok') ?? []
  const tuttiScelti = importabili.length > 0 && importabili.every((r) => scelti.has(r.listingId))
  const importati = Object.values(esiti).filter((e) => e.tipo === 'ok').length
  // auto.dev non dice quante pagine ci sono: se la pagina e' piena probabilmente ce n'e' un'altra
  const haSuccessiva = !!ricerca && !!risultati && risultati.length === ricerca.limite && ricerca.pagina < PAGINA_MAX

  const pulsantePagina =
    'flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold transition-colors enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-notte-bordo dark:bg-notte-card dark:enabled:hover:bg-notte-hover'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Importa da auto.dev</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Ogni pagina di risultati costa 1 chiamata auto.dev; ogni import 2 (nessuna se hai appena aperto l'anteprima).
        </p>
      </div>

      <form onSubmit={onCerca} noValidate className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-notte-bordo dark:bg-notte-card">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_auto]">
          <div>
            <label htmlFor="import-marca" className="mb-1.5 block text-sm font-semibold">Marca</label>
            <input id="import-marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="es. Subaru" maxLength={40} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="import-modello" className="mb-1.5 block text-sm font-semibold">Modello</label>
            <input id="import-modello" value={modello} onChange={(e) => setModello(e.target.value)} placeholder="es. Outback" maxLength={40} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="import-limite" className="mb-1.5 block text-sm font-semibold">Risultati per pagina</label>
            <select id="import-limite" value={limite} onChange={(e) => setLimite(Number(e.target.value))} className={classeCampo}>
              {LIMITI.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={cercando}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            <Icona nome="search" className="text-lg" />
            {cercando ? 'Ricerca...' : 'Cerca annunci'}
          </button>
        </div>
        {erroreRicerca && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <Icona nome="error" className="text-base" />
            {erroreRicerca}
          </p>
        )}
      </form>

      {risultati && risultati.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-notte-bordo dark:bg-notte-card dark:text-slate-400">
          {ricerca && ricerca.pagina > 1 ? 'Non ci sono altri risultati.' : 'Nessun annuncio trovato su auto.dev con questi filtri.'}
        </p>
      )}

      {risultati && ricerca && (risultati.length > 0 || ricerca.pagina > 1) && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-notte-bordo dark:bg-notte-card">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={tuttiScelti}
                  disabled={importabili.length === 0 || importoMultiplo}
                  onChange={() => setScelti(tuttiScelti ? new Set() : new Set(importabili.map((r) => r.listingId)))}
                  className="size-4 accent-blue-600"
                />
                Seleziona tutti
              </label>
              <button
                type="button"
                onClick={() => void importaScelti()}
                disabled={scelti.size === 0 || importoMultiplo}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icona nome="download" className="text-lg" />
                {importoMultiplo ? 'Importazione...' : `Importa selezionati (${scelti.size})`}
              </button>
            </div>

            {importati > 0 && (
              <p role="status" className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Icona nome="check_circle" className="text-lg" />
                {importati === 1 ? '1 annuncio importato come bozza.' : `${importati} annunci importati come bozze.`}
                <Link to="/admin?stato=BOZZA" className="font-semibold underline">Vai alle bozze</Link>
              </p>
            )}

            <ul className="space-y-3" aria-label="Risultati auto.dev">
              {risultati.map((r) => (
                <RigaRisultato
                  key={r.listingId}
                  annuncio={r}
                  attivo={r.listingId === selezionato}
                  scelto={scelti.has(r.listingId)}
                  esito={esiti[r.listingId]}
                  bloccato={importoMultiplo}
                  onApri={() => void apri(r.listingId)}
                  onScegli={() => alternaScelta(r.listingId)}
                />
              ))}
            </ul>

            <nav aria-label="Pagine dei risultati auto.dev" className="flex items-center justify-between gap-3">
              <button type="button" disabled={ricerca.pagina <= 1 || cercando || importoMultiplo} onClick={() => cambiaPagina(-1)} className={pulsantePagina}>
                <Icona nome="arrow_back" className="text-base" />
                Precedente
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Pagina {ricerca.pagina}</span>
              <button type="button" disabled={!haSuccessiva || cercando || importoMultiplo} onClick={() => cambiaPagina(1)} className={pulsantePagina}>
                Successiva
                <Icona nome="arrow_forward" className="text-base" />
              </button>
            </nav>
          </div>

          <section aria-label="Anteprima annuncio" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 dark:border-notte-bordo dark:bg-notte-card">
            {!selezionato && <p className="py-16 text-center text-slate-500 dark:text-slate-400">Scegli un annuncio per vederne l'anteprima.</p>}
            {caricaAnteprima && <div className="h-96 animate-pulse rounded-lg bg-slate-200 dark:bg-notte-hover" aria-busy="true" />}
            {erroreAnteprima && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{erroreAnteprima}</p>}
            {anteprima && <Anteprima dati={anteprima} />}
            {anteprima && (
              <div className="space-y-3 border-t border-slate-100 pt-5 dark:border-notte-bordo">
                <PulsanteImportaAnteprima
                  esito={esiti[anteprima.listingId]}
                  disabilitato={importoMultiplo}
                  onImporta={() => void importaUno(anteprima.listingId)}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  L'annuncio viene salvato in bozza: potrai correggere prezzo, km, stato e descrizione prima di pubblicarlo.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function RigaRisultato({
  annuncio: r,
  attivo,
  scelto,
  esito,
  bloccato,
  onApri,
  onScegli,
}: {
  annuncio: AnnuncioAutoDev
  attivo: boolean
  scelto: boolean
  esito?: EsitoImport
  bloccato: boolean
  onApri: () => void
  onScegli: () => void
}) {
  const importato = esito?.tipo === 'ok'
  return (
    <li
      className={`flex gap-3 rounded-xl border bg-white p-3 transition-colors dark:bg-notte-card ${
        attivo ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 dark:border-notte-bordo'
      }`}
    >
      <input
        type="checkbox"
        checked={scelto || importato}
        disabled={importato || bloccato}
        onChange={onScegli}
        aria-label={`Seleziona ${r.marca} ${r.modello} ${r.anno}`}
        className="mt-1 size-4 shrink-0 accent-blue-600"
      />
      <button type="button" onClick={onApri} aria-pressed={attivo} className="flex min-w-0 flex-1 gap-4 text-left">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg">
          <ImmagineAuto src={r.immaginePrincipale} alt="" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-bold">{r.marca} {r.modello} {r.anno}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {[r.carburante, r.miglia !== null ? `${formatoMiglia.format(r.miglia)} mi` : null, r.usato === null ? null : r.usato ? 'Usato' : 'Nuovo']
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="font-semibold">{r.prezzoUsd !== null ? formatoUsd.format(r.prezzoUsd) : 'Prezzo non indicato'}</p>
          <p className="truncate font-mono text-xs text-slate-400">{r.listingId}</p>
          <EsitoRiga esito={esito} />
        </div>
      </button>
    </li>
  )
}

function EsitoRiga({ esito }: { esito?: EsitoImport }) {
  if (!esito) return null
  if (esito.tipo === 'inCorso') return <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Importazione in corso...</p>
  if (esito.tipo === 'ok')
    return (
      <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <Icona nome="check" className="text-sm" />
        Importato come bozza
      </p>
    )
  return (
    <p role="alert" className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
      <Icona nome="error" className="text-sm" />
      {esito.messaggio}
    </p>
  )
}

function PulsanteImportaAnteprima({ esito, disabilitato, onImporta }: { esito?: EsitoImport; disabilitato: boolean; onImporta: () => void }) {
  if (esito?.tipo === 'ok') {
    return (
      <p role="status" className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Icona nome="check_circle" className="text-lg" />
        Importato come bozza.
        <Link to="/admin?stato=BOZZA" className="font-semibold underline">Vai alle bozze</Link>
      </p>
    )
  }
  return (
    <>
      <button
        type="button"
        onClick={onImporta}
        disabled={disabilitato || esito?.tipo === 'inCorso'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
      >
        <Icona nome="download" className="text-lg" />
        {esito?.tipo === 'inCorso' ? 'Importazione...' : 'Importa come bozza'}
      </button>
      {esito?.tipo === 'errore' && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <Icona nome="error" className="text-base" />
          {esito.messaggio}
        </p>
      )}
    </>
  )
}

function Anteprima({ dati }: { dati: AnteprimaAnnuncio }) {
  const titolo = `${dati.marca} ${dati.modello} ${dati.anno}`
  return (
    <div className="space-y-5">
      <GalleriaAuto key={dati.listingId} immagini={dati.foto} titolo={titolo} />
      <div className="space-y-2">
        {dati.statoSuggerito && <BadgeStato stato={dati.statoSuggerito} />}
        <h2 className="text-2xl font-bold">{titolo}</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">Venditore</dt>
          <dd className="font-medium">{dati.venditore ?? '—'}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Km</dt>
          <dd className="font-medium">{dati.km !== null ? formattaKm(dati.km) : '—'}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Prezzo USD</dt>
          <dd className="font-medium">{dati.prezzoUsd !== null ? formatoUsd.format(dati.prezzoUsd) : '—'}</dd>
        </dl>
        <p className="text-3xl font-extrabold">{dati.prezzoEur !== null ? formattaPrezzo(dati.prezzoEur) : 'Prezzo da definire'}</p>
      </div>
      {dati.descrizione && (
        <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">{dati.descrizione}</p>
      )}
      <SchedaTecnica scheda={dati.schedaTecnica} vin={dati.vin} />
    </div>
  )
}
