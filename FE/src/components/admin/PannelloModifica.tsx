import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { aggiornaAuto, mettiInBozza, pubblicaAuto } from '../../api/admin'
import { erroriCampi, messaggioErrore } from '../../api/client'
import type { AutoAdmin, StatoAuto } from '../../api/types'
import { ETICHETTA_STATO } from '../../utils/formatta'
import { Icona } from '../Icona'
import { ImmagineAuto } from '../auto/PartiAuto'
import { PillolaPubblicazione } from './PillolaPubblicazione'

// Stessi limiti del BE (AutoUpdateDto)
const PREZZO_REGEX = /^\d{1,7}([.,]\d{1,2})?$/
const MAX_DESCRIZIONE = 5000
const MAX_KM = 999_999

type Campo = 'prezzo' | 'km' | 'stato' | 'descrizione'

interface Bozza {
  prezzo: string
  km: string
  stato: StatoAuto | ''
  descrizione: string
}

function valida(b: Bozza): Partial<Record<Campo, string>> {
  const e: Partial<Record<Campo, string>> = {}
  const prezzo = b.prezzo.trim()
  if (!prezzo) e.prezzo = 'Il prezzo è obbligatorio'
  else if (!PREZZO_REGEX.test(prezzo)) e.prezzo = 'Prezzo non valido (max 7 cifre intere e 2 decimali)'
  else if (Number(prezzo.replace(',', '.')) <= 0) e.prezzo = 'Il prezzo deve essere maggiore di zero'
  const km = b.km.trim()
  if (!km) e.km = 'Il chilometraggio è obbligatorio'
  else if (!/^\d+$/.test(km) || Number(km) > MAX_KM) e.km = 'Chilometraggio non valido (numero intero, max 6 cifre)'
  if (!b.stato) e.stato = 'Lo stato è obbligatorio'
  if (!b.descrizione.trim()) e.descrizione = 'La descrizione è obbligatoria'
  else if (b.descrizione.length > MAX_DESCRIZIONE) e.descrizione = `Massimo ${MAX_DESCRIZIONE} caratteri`
  return e
}

const classeCampo = (errore?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 dark:bg-notte-sfondo ${
    errore ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-notte-bordo'
  }`

// Pannello laterale di modifica di un annuncio. "onAggiornato" riceve l'annuncio salvato dal BE.
export function PannelloModifica({
  auto,
  onChiudi,
  onAggiornato,
}: {
  auto: AutoAdmin
  onChiudi: () => void
  onAggiornato: (auto: AutoAdmin) => void
}) {
  const [bozza, setBozza] = useState<Bozza>({
    prezzo: auto.prezzo?.toString() ?? '',
    km: auto.km?.toString() ?? '',
    stato: auto.stato ?? '',
    descrizione: auto.descrizione ?? '',
  })
  const [errori, setErrori] = useState<Partial<Record<Campo, string>>>({})
  const [messaggio, setMessaggio] = useState<{ tipo: 'ok' | 'errore'; testo: string } | null>(null)
  const [inCorso, setInCorso] = useState(false)
  const id = useId()
  const primoCampo = useRef<HTMLInputElement>(null)

  // Focus sul primo campo solo all'apertura
  useEffect(() => {
    primoCampo.current?.focus()
  }, [])

  // Esc chiude il pannello
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChiudi()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChiudi])

  function aggiorna<K extends keyof Bozza>(campo: K, valore: Bozza[K]) {
    setBozza((b) => ({ ...b, [campo]: valore }))
    setErrori((e) => ({ ...e, [campo]: undefined }))
    setMessaggio(null)
  }

  async function esegui(azione: () => Promise<AutoAdmin>, conferma: string) {
    setInCorso(true)
    setMessaggio(null)
    try {
      onAggiornato(await azione())
      setMessaggio({ tipo: 'ok', testo: conferma })
    } catch (err) {
      const campi = erroriCampi(err)
      if (Object.keys(campi).length > 0) setErrori(campi as Partial<Record<Campo, string>>)
      setMessaggio({ tipo: 'errore', testo: messaggioErrore(err) })
    } finally {
      setInCorso(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trovati = valida(bozza)
    setErrori(trovati)
    if (Object.keys(trovati).length > 0 || !bozza.stato) return
    const stato = bozza.stato
    void esegui(
      () =>
        aggiornaAuto(auto.id, {
          prezzo: Number(bozza.prezzo.trim().replace(',', '.')),
          km: Number(bozza.km.trim()),
          stato,
          descrizione: bozza.descrizione,
        }),
      'Modifiche salvate',
    )
  }

  const pubblicato = auto.statoPubblicazione === 'PUBBLICATO'
  const errore = (campo: Campo) =>
    errori[campo] && (
      <p id={`${id}-${campo}-err`} className="mt-1 text-sm text-red-600 dark:text-red-400">
        {errori[campo]}
      </p>
    )
  const descrittoDa = (campo: Campo) => (errori[campo] ? `${id}-${campo}-err` : undefined)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Chiudi pannello" onClick={onChiudi} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titolo`}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-slate-200 bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-2xl dark:border-notte-bordo dark:bg-notte-card"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-notte-bordo">
          <h2 id={`${id}-titolo`} className="text-lg font-bold">
            Modifica annuncio
          </h2>
          <button type="button" onClick={onChiudi} aria-label="Chiudi" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-notte-hover">
            <Icona nome="close" className="text-xl" />
          </button>
        </div>

        <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 dark:border-notte-bordo">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg">
            <ImmagineAuto src={auto.immagini[0] ?? null} alt="" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-bold">
              {auto.marca} {auto.modello} {auto.anno}
            </p>
            <p className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">{auto.vin}</p>
            <PillolaPubblicazione stato={auto.statoPubblicazione} />
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="flex-1 space-y-5 px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${id}-prezzo`} className="mb-1.5 block text-sm font-semibold">
                Prezzo (€)
              </label>
              <input
                ref={primoCampo}
                id={`${id}-prezzo`}
                inputMode="decimal"
                value={bozza.prezzo}
                onChange={(e) => aggiorna('prezzo', e.target.value)}
                aria-invalid={errori.prezzo ? true : undefined}
                aria-describedby={descrittoDa('prezzo')}
                className={classeCampo(errori.prezzo)}
              />
              {errore('prezzo')}
            </div>
            <div>
              <label htmlFor={`${id}-km`} className="mb-1.5 block text-sm font-semibold">
                Chilometri
              </label>
              <input
                id={`${id}-km`}
                inputMode="numeric"
                value={bozza.km}
                onChange={(e) => aggiorna('km', e.target.value)}
                aria-invalid={errori.km ? true : undefined}
                aria-describedby={descrittoDa('km')}
                className={classeCampo(errori.km)}
              />
              {errore('km')}
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-stato`} className="mb-1.5 block text-sm font-semibold">
              Stato
            </label>
            <select
              id={`${id}-stato`}
              value={bozza.stato}
              onChange={(e) => aggiorna('stato', e.target.value as StatoAuto | '')}
              aria-invalid={errori.stato ? true : undefined}
              aria-describedby={descrittoDa('stato')}
              className={classeCampo(errori.stato)}
            >
              <option value="">Scegli...</option>
              {(Object.keys(ETICHETTA_STATO) as StatoAuto[]).map((s) => (
                <option key={s} value={s}>
                  {ETICHETTA_STATO[s]}
                </option>
              ))}
            </select>
            {errore('stato')}
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor={`${id}-descrizione`} className="text-sm font-semibold">
                Descrizione
              </label>
              <span className={`text-xs tabular-nums ${bozza.descrizione.length > MAX_DESCRIZIONE ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
                {bozza.descrizione.length} / {MAX_DESCRIZIONE}
              </span>
            </div>
            <textarea
              id={`${id}-descrizione`}
              rows={9}
              value={bozza.descrizione}
              onChange={(e) => aggiorna('descrizione', e.target.value)}
              aria-invalid={errori.descrizione ? true : undefined}
              aria-describedby={descrittoDa('descrizione')}
              className={`${classeCampo(errori.descrizione)} resize-y leading-relaxed`}
            />
            {errore('descrizione')}
          </div>

          {messaggio && (
            <p
              role={messaggio.tipo === 'errore' ? 'alert' : 'status'}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                messaggio.tipo === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              <Icona nome={messaggio.tipo === 'ok' ? 'check_circle' : 'error'} className="text-lg" />
              {messaggio.testo}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={inCorso}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              Salva modifiche
            </button>
            <button
              type="button"
              onClick={onChiudi}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 dark:border-notte-bordo dark:hover:bg-notte-hover"
            >
              Chiudi
            </button>
          </div>
        </form>

        <div className="space-y-2 border-t border-slate-100 px-6 py-5 dark:border-notte-bordo">
          {pubblicato ? (
            <button
              type="button"
              disabled={inCorso}
              onClick={() => void esegui(() => mettiInBozza(auto.id), 'Annuncio rimesso in bozza')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 py-2.5 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-60 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              <Icona nome="visibility_off" className="text-lg" />
              Metti in bozza
            </button>
          ) : (
            <button
              type="button"
              disabled={inCorso}
              onClick={() => void esegui(() => pubblicaAuto(auto.id), 'Annuncio pubblicato in vetrina')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
            >
              <Icona nome="publish" className="text-lg" />
              Pubblica annuncio
            </button>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pubblicato
              ? "In bozza l'annuncio sparisce dalla vetrina; nei preferiti degli utenti risulta non disponibile."
              : 'Si pubblicano le modifiche salvate. Per pubblicare servono prezzo, km, stato e descrizione.'}
          </p>
        </div>
      </aside>
    </div>
  )
}
