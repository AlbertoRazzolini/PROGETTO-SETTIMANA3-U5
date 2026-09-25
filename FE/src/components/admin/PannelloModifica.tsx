import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { aggiornaAuto, aggiornaPrezzo, mettiInBozza, pubblicaAuto } from '../../api/admin'
import { erroriCampi, messaggioErrore } from '../../api/client'
import type { AutoAdmin, StatoAuto } from '../../api/types'
import { ETICHETTA_STATO, formattaPrezzo } from '../../utils/formatta'
import { Icona } from '../Icona'
import { ImmagineAuto } from '../auto/PartiAuto'
import { PillolaPubblicazione } from './PillolaPubblicazione'

// Stessi limiti del BE (PrezzoUpdateDto e AutoUpdateDto)
const PREZZO_REGEX = /^\d{1,7}([.,]\d{1,2})?$/
const MAX_DESCRIZIONE = 5000
const MAX_KM = 999_999

type Esito = { tipo: 'ok' | 'errore'; testo: string } | null

const classeCampo = (errore?: string) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 dark:bg-notte-sfondo ${
    errore ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-notte-bordo'
  }`

const classePrimario =
  'rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-60'

function Messaggio({ esito }: { esito: Esito }) {
  if (!esito) return null
  return (
    <p
      role={esito.tipo === 'errore' ? 'alert' : 'status'}
      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
        esito.tipo === 'ok'
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
      }`}
    >
      <Icona nome={esito.tipo === 'ok' ? 'check_circle' : 'error'} className="text-lg" />
      {esito.testo}
    </p>
  )
}

function Sezione({ titolo, icona, children }: { titolo: string; icona: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-b border-slate-100 px-6 py-5 dark:border-notte-bordo">
      <h3 className="flex items-center gap-2 font-bold">
        <Icona nome={icona} className="text-lg text-blue-600 dark:text-blue-400" />
        {titolo}
      </h3>
      {children}
    </section>
  )
}

// Pannello laterale di modifica di un annuncio. Prezzo e dettagli si salvano separatamente,
// come nel BE: solo il cambio di prezzo fa partire il controllo degli avvisi.
export function PannelloModifica({
  auto,
  onChiudi,
  onAggiornato,
}: {
  auto: AutoAdmin
  onChiudi: () => void
  onAggiornato: (auto: AutoAdmin) => void
}) {
  const id = useId()
  const [esitoPubblicazione, setEsitoPubblicazione] = useState<Esito>(null)
  const [inCorso, setInCorso] = useState(false)

  // Esc chiude il pannello
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChiudi()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChiudi])

  async function cambiaPubblicazione() {
    setInCorso(true)
    setEsitoPubblicazione(null)
    try {
      onAggiornato(await (pubblicato ? mettiInBozza(auto.id) : pubblicaAuto(auto.id)))
      setEsitoPubblicazione({ tipo: 'ok', testo: pubblicato ? 'Annuncio rimesso in bozza' : 'Annuncio pubblicato in vetrina' })
    } catch (err) {
      setEsitoPubblicazione({ tipo: 'errore', testo: messaggioErrore(err) })
    } finally {
      setInCorso(false)
    }
  }

  const pubblicato = auto.statoPubblicazione === 'PUBBLICATO'

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
          <button type="button" onClick={onChiudi} aria-label="Chiudi" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-notte-hover">
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

        <FormPrezzo auto={auto} onAggiornato={onAggiornato} />
        <FormDettagli auto={auto} onAggiornato={onAggiornato} />

        <div className="space-y-2 px-6 py-5">
          <Messaggio esito={esitoPubblicazione} />
          {pubblicato ? (
            <button
              type="button"
              disabled={inCorso}
              onClick={() => void cambiaPubblicazione()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 py-2.5 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-50 disabled:opacity-60 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              <Icona nome="visibility_off" className="text-lg" />
              Metti in bozza
            </button>
          ) : (
            <button
              type="button"
              disabled={inCorso}
              onClick={() => void cambiaPubblicazione()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
            >
              <Icona nome="publish" className="text-lg" />
              Pubblica annuncio
            </button>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pubblicato
              ? "In bozza l'annuncio sparisce dalla vetrina; nei preferiti degli utenti risulta non disponibile."
              : 'Si pubblicano prezzo e dettagli salvati. Per pubblicare servono prezzo, km, stato e descrizione.'}
          </p>
        </div>
      </aside>
    </div>
  )
}

function FormPrezzo({ auto, onAggiornato }: { auto: AutoAdmin; onAggiornato: (auto: AutoAdmin) => void }) {
  const [testo, setTesto] = useState(auto.prezzo?.toString() ?? '')
  const [errore, setErrore] = useState<string | undefined>()
  const [esito, setEsito] = useState<Esito>(null)
  const [inCorso, setInCorso] = useState(false)
  const idCampo = useId()
  const campo = useRef<HTMLInputElement>(null)

  // Focus sul prezzo all'apertura del pannello
  useEffect(() => {
    campo.current?.focus()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const t = testo.trim()
    const prezzo = Number(t.replace(',', '.'))
    const problema = !t
      ? 'Il prezzo è obbligatorio'
      : !PREZZO_REGEX.test(t)
        ? 'Prezzo non valido (max 7 cifre intere e 2 decimali)'
        : prezzo <= 0
          ? 'Il prezzo deve essere maggiore di zero'
          : undefined
    setErrore(problema)
    setEsito(null)
    if (problema) return
    if (auto.prezzo !== null && prezzo === auto.prezzo) {
      setEsito({ tipo: 'ok', testo: 'Il prezzo è già questo' })
      return
    }
    setInCorso(true)
    try {
      onAggiornato(await aggiornaPrezzo(auto.id, prezzo))
      setEsito({ tipo: 'ok', testo: `Prezzo aggiornato a ${formattaPrezzo(prezzo)}` })
    } catch (err) {
      setErrore(erroriCampi(err).prezzo)
      setEsito({ tipo: 'errore', testo: messaggioErrore(err) })
    } finally {
      setInCorso(false)
    }
  }

  return (
    <Sezione titolo="Prezzo" icona="euro">
      <form onSubmit={onSubmit} noValidate className="space-y-3">
        <label htmlFor={idCampo} className="sr-only">
          Prezzo in euro
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">€</span>
            <input
              ref={campo}
              id={idCampo}
              inputMode="decimal"
              value={testo}
              onChange={(e) => {
                setTesto(e.target.value)
                setErrore(undefined)
                setEsito(null)
              }}
              aria-invalid={errore ? true : undefined}
              aria-describedby={errore ? `${idCampo}-err` : `${idCampo}-nota`}
              className={`${classeCampo(errore)} pl-7`}
            />
          </div>
          <button type="submit" disabled={inCorso} className={classePrimario}>
            Aggiorna prezzo
          </button>
        </div>
        {errore ? (
          <p id={`${idCampo}-err`} className="text-sm text-red-600 dark:text-red-400">
            {errore}
          </p>
        ) : (
          <p id={`${idCampo}-nota`} className="text-xs text-slate-500 dark:text-slate-400">
            Se l'annuncio è pubblicato, chi ha un avviso sopra il nuovo prezzo riceve notifica e mail.
          </p>
        )}
        <Messaggio esito={esito} />
      </form>
    </Sezione>
  )
}

type CampoDettagli = 'km' | 'stato' | 'descrizione'

function FormDettagli({ auto, onAggiornato }: { auto: AutoAdmin; onAggiornato: (auto: AutoAdmin) => void }) {
  const [km, setKm] = useState(auto.km?.toString() ?? '')
  const [stato, setStato] = useState<StatoAuto | ''>(auto.stato ?? '')
  const [descrizione, setDescrizione] = useState(auto.descrizione ?? '')
  const [errori, setErrori] = useState<Partial<Record<CampoDettagli, string>>>({})
  const [esito, setEsito] = useState<Esito>(null)
  const [inCorso, setInCorso] = useState(false)
  const id = useId()

  function pulisci(campo: CampoDettagli) {
    setErrori((e) => ({ ...e, [campo]: undefined }))
    setEsito(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trovati: Partial<Record<CampoDettagli, string>> = {}
    const k = km.trim()
    if (!k) trovati.km = 'Il chilometraggio è obbligatorio'
    else if (!/^\d+$/.test(k) || Number(k) > MAX_KM) trovati.km = 'Chilometraggio non valido (numero intero, max 6 cifre)'
    if (!stato) trovati.stato = 'Lo stato è obbligatorio'
    if (!descrizione.trim()) trovati.descrizione = 'La descrizione è obbligatoria'
    else if (descrizione.length > MAX_DESCRIZIONE) trovati.descrizione = `Massimo ${MAX_DESCRIZIONE} caratteri`
    setErrori(trovati)
    setEsito(null)
    if (Object.keys(trovati).length > 0 || !stato) return

    setInCorso(true)
    try {
      onAggiornato(await aggiornaAuto(auto.id, { km: Number(k), stato, descrizione }))
      setEsito({ tipo: 'ok', testo: 'Dettagli salvati' })
    } catch (err) {
      const campi = erroriCampi(err)
      if (Object.keys(campi).length > 0) setErrori(campi as Partial<Record<CampoDettagli, string>>)
      setEsito({ tipo: 'errore', testo: messaggioErrore(err) })
    } finally {
      setInCorso(false)
    }
  }

  const errore = (campo: CampoDettagli) =>
    errori[campo] && (
      <p id={`${id}-${campo}-err`} className="mt-1 text-sm text-red-600 dark:text-red-400">
        {errori[campo]}
      </p>
    )
  const descrittoDa = (campo: CampoDettagli) => (errori[campo] ? `${id}-${campo}-err` : undefined)

  return (
    <Sezione titolo="Dettagli" icona="edit_note">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-km`} className="mb-1.5 block text-sm font-semibold">
              Chilometri
            </label>
            <input
              id={`${id}-km`}
              inputMode="numeric"
              value={km}
              onChange={(e) => {
                setKm(e.target.value)
                pulisci('km')
              }}
              aria-invalid={errori.km ? true : undefined}
              aria-describedby={descrittoDa('km')}
              className={classeCampo(errori.km)}
            />
            {errore('km')}
          </div>
          <div>
            <label htmlFor={`${id}-stato`} className="mb-1.5 block text-sm font-semibold">
              Stato
            </label>
            <select
              id={`${id}-stato`}
              value={stato}
              onChange={(e) => {
                setStato(e.target.value as StatoAuto | '')
                pulisci('stato')
              }}
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
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor={`${id}-descrizione`} className="text-sm font-semibold">
              Descrizione
            </label>
            <span className={`text-xs tabular-nums ${descrizione.length > MAX_DESCRIZIONE ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
              {descrizione.length} / {MAX_DESCRIZIONE}
            </span>
          </div>
          <textarea
            id={`${id}-descrizione`}
            rows={9}
            value={descrizione}
            onChange={(e) => {
              setDescrizione(e.target.value)
              pulisci('descrizione')
            }}
            aria-invalid={errori.descrizione ? true : undefined}
            aria-describedby={descrittoDa('descrizione')}
            className={`${classeCampo(errori.descrizione)} resize-y leading-relaxed`}
          />
          {errore('descrizione')}
        </div>

        <Messaggio esito={esito} />
        <button type="submit" disabled={inCorso} className={`${classePrimario} w-full`}>
          Salva dettagli
        </button>
      </form>
    </Sezione>
  )
}
