import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { anteprimaAnnuncio, cercaAnnunciAutoDev, importaAnnuncio } from '../../api/admin'
import { messaggioErrore } from '../../api/client'
import type { AnnuncioAutoDev, AnteprimaAnnuncio, AutoAdmin } from '../../api/types'
import { GalleriaAuto } from '../../components/auto/GalleriaAuto'
import { BadgeStato, ImmagineAuto } from '../../components/auto/PartiAuto'
import { SchedaTecnica } from '../../components/auto/SchedaTecnica'
import { Icona } from '../../components/Icona'
import { formattaKm, formattaPrezzo } from '../../utils/formatta'

// Stessa regola del BE (AutoDevAdminController.REGEX_TESTO_FILTRO); campo vuoto = filtro non usato
const TESTO_FILTRO = /^[\p{L}\p{N} .-]{0,40}$/u
const LIMITI = [1, 3, 5, 10]

const formatoUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const formatoMiglia = new Intl.NumberFormat('it-IT')

const classeCampo =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-notte-bordo dark:bg-notte-sfondo'

export function AdminImporta() {
  const [marca, setMarca] = useState('')
  const [modello, setModello] = useState('')
  const [limite, setLimite] = useState(1)
  const [risultati, setRisultati] = useState<AnnuncioAutoDev[] | null>(null)
  const [cercando, setCercando] = useState(false)
  const [erroreRicerca, setErroreRicerca] = useState<string | null>(null)

  const [selezionato, setSelezionato] = useState<string | null>(null)
  // Ultima riga scelta: le risposte di anteprime precedenti vengono scartate
  const ultimaScelta = useRef<string | null>(null)
  const [anteprima, setAnteprima] = useState<AnteprimaAnnuncio | null>(null)
  const [caricaAnteprima, setCaricaAnteprima] = useState(false)
  const [erroreAnteprima, setErroreAnteprima] = useState<string | null>(null)

  const [importando, setImportando] = useState(false)
  const [importato, setImportato] = useState<AutoAdmin | null>(null)
  const [erroreImport, setErroreImport] = useState<string | null>(null)

  async function cerca(e: FormEvent) {
    e.preventDefault()
    if (!TESTO_FILTRO.test(marca.trim()) || !TESTO_FILTRO.test(modello.trim())) {
      setErroreRicerca('Marca e modello possono contenere solo lettere, numeri, spazi, punti e trattini')
      return
    }
    setCercando(true)
    setErroreRicerca(null)
    setSelezionato(null)
    ultimaScelta.current = null
    setAnteprima(null)
    setImportato(null)
    try {
      setRisultati(await cercaAnnunciAutoDev(marca.trim(), modello.trim(), limite))
    } catch (err) {
      setErroreRicerca(messaggioErrore(err))
    } finally {
      setCercando(false)
    }
  }

  async function apri(listingId: string) {
    setSelezionato(listingId)
    ultimaScelta.current = listingId
    setAnteprima(null)
    setErroreAnteprima(null)
    setImportato(null)
    setErroreImport(null)
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

  async function importa() {
    if (!anteprima) return
    setImportando(true)
    setErroreImport(null)
    try {
      setImportato(await importaAnnuncio(anteprima.listingId))
    } catch (err) {
      setErroreImport(messaggioErrore(err))
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Importa da auto.dev</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Ogni ricerca consuma crediti auto.dev: cerca con filtri precisi.</p>
      </div>

      <form onSubmit={cerca} noValidate className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-notte-bordo dark:bg-notte-card">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_140px_auto]">
          <div>
            <label htmlFor="import-marca" className="mb-1.5 block text-sm font-semibold">Marca</label>
            <input id="import-marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="es. Subaru" maxLength={40} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="import-modello" className="mb-1.5 block text-sm font-semibold">Modello</label>
            <input id="import-modello" value={modello} onChange={(e) => setModello(e.target.value)} placeholder="es. Outback" maxLength={40} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="import-limite" className="mb-1.5 block text-sm font-semibold">Risultati</label>
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
          Nessun annuncio trovato su auto.dev con questi filtri.
        </p>
      )}

      {risultati && risultati.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]">
          <ul className="space-y-3" aria-label="Risultati auto.dev">
            {risultati.map((r) => {
              const attivo = r.listingId === selezionato
              return (
                <li key={r.listingId}>
                  <button
                    type="button"
                    onClick={() => void apri(r.listingId)}
                    aria-pressed={attivo}
                    className={`flex w-full gap-4 rounded-xl border bg-white p-3 text-left transition-colors dark:bg-notte-card ${
                      attivo ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 hover:border-slate-300 dark:border-notte-bordo dark:hover:border-slate-600'
                    }`}
                  >
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
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <section aria-label="Anteprima annuncio" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 dark:border-notte-bordo dark:bg-notte-card">
            {!selezionato && <p className="py-16 text-center text-slate-500 dark:text-slate-400">Scegli un annuncio per vederne l'anteprima.</p>}
            {caricaAnteprima && <div className="h-96 animate-pulse rounded-lg bg-slate-200 dark:bg-notte-hover" aria-busy="true" />}
            {erroreAnteprima && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{erroreAnteprima}</p>}
            {anteprima && <Anteprima dati={anteprima} />}
            {anteprima && (
              <div className="space-y-3 border-t border-slate-100 pt-5 dark:border-notte-bordo">
                {importato ? (
                  <p role="status" className="flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Icona nome="check_circle" className="text-lg" />
                    Importato come bozza.
                    <Link to="/admin?stato=BOZZA" className="font-semibold underline">Vai alle bozze</Link>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void importa()}
                    disabled={importando}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Icona nome="download" className="text-lg" />
                    {importando ? 'Importazione...' : 'Importa come bozza'}
                  </button>
                )}
                {erroreImport && (
                  <p role="alert" className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <Icona nome="error" className="text-base" />
                    {erroreImport}
                  </p>
                )}
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
