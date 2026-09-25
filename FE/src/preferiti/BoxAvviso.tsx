import { useId, useState, type FormEvent } from 'react'
import { erroriCampi, messaggioErrore } from '../api/client'
import type { Avviso, Preferito } from '../api/types'
import { Icona } from '../components/Icona'
import { formattaPrezzo } from '../utils/formatta'
import { usePreferiti } from './preferitiState'

// Stessi limiti del BE (AvvisoCreateDto): > 0, max 7 cifre intere e 2 decimali
const SOGLIA_REGEX = /^\d{1,7}([.,]\d{1,2})?$/

// La soglia deve stare sotto il prezzo attuale: l'avviso segnala un ribasso (stessa regola del BE)
function leggiSoglia(testo: string, prezzo: number): number | string {
  const t = testo.trim()
  if (!t) return 'Inserisci una soglia'
  if (!SOGLIA_REGEX.test(t)) return 'Soglia non valida (max 7 cifre intere e 2 decimali)'
  const n = Number(t.replace(',', '.'))
  if (n <= 0) return 'La soglia deve essere maggiore di zero'
  if (n >= prezzo) return `La soglia deve essere inferiore al prezzo attuale (${formattaPrezzo(prezzo)})`
  return n
}

function PillolaStato({ avviso }: { avviso: Avviso }) {
  const [testo, classe] = !avviso.attivo
    ? ['Disattivato', 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300']
    : avviso.notificato
      ? ['Notificato', 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300']
      : ['Attivo', 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300']
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase ${classe}`}>{testo}</span>
}

// Avviso di prezzo di un preferito: crea, modifica soglia, elimina
export function BoxAvviso({ preferito, compatto = false }: { preferito: Preferito; compatto?: boolean }) {
  const { avvisoDi, salvaAvviso, eliminaAvviso } = usePreferiti()
  const avviso = avvisoDi(preferito.id)
  const [modifica, setModifica] = useState(false)
  const [testo, setTesto] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)
  const idCampo = useId()

  const mostraForm = !avviso || modifica

  function apriModifica() {
    setTesto(avviso ? String(avviso.soglia) : '')
    setErrore(null)
    setModifica(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const soglia = leggiSoglia(testo, preferito.auto.prezzo)
    if (typeof soglia === 'string') {
      setErrore(soglia)
      return
    }
    setInCorso(true)
    setErrore(null)
    try {
      await salvaAvviso(preferito.id, soglia)
      setModifica(false)
      setTesto('')
    } catch (err) {
      setErrore(erroriCampi(err).soglia ?? messaggioErrore(err))
    } finally {
      setInCorso(false)
    }
  }

  async function elimina() {
    if (!avviso) return
    setInCorso(true)
    await eliminaAvviso(avviso)
    setInCorso(false)
  }

  const classeSecondario =
    'rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-notte-bordo dark:hover:bg-notte-hover'

  return (
    <div className={`space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 ${compatto ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-bold">
          <Icona nome="notifications_active" className="text-lg text-blue-600 dark:text-blue-400" />
          Avviso di prezzo
        </h3>
        {avviso && !modifica && <PillolaStato avviso={avviso} />}
      </div>

      {avviso && !modifica && (
        <>
          <p className="text-sm">
            Avvisami sotto <strong>{formattaPrezzo(avviso.soglia)}</strong>
          </p>
          {avviso.attivo && avviso.notificato && (
            <p className="text-xs text-slate-600 dark:text-slate-400">Il prezzo è sceso sotto la tua soglia: ti abbiamo inviato una mail.</p>
          )}
          {!avviso.attivo && (
            <p className="text-xs text-slate-600 dark:text-slate-400">Disattivato dal link nella mail. Salva una nuova soglia per riattivarlo.</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={apriModifica} disabled={inCorso} className={classeSecondario}>
              Modifica
            </button>
            <button type="button" onClick={() => void elimina()} disabled={inCorso} className={`${classeSecondario} text-red-600 dark:text-red-400`}>
              Elimina
            </button>
          </div>
        </>
      )}

      {mostraForm && (
        <form onSubmit={onSubmit} noValidate className="space-y-2">
          {!avviso && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ricevi una notifica e una mail quando il prezzo scende sotto la tua soglia.
            </p>
          )}
          <label htmlFor={idCampo} className="sr-only">
            Soglia in euro
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">€</span>
              <input
                id={idCampo}
                inputMode="decimal"
                value={testo}
                onChange={(e) => {
                  setTesto(e.target.value)
                  setErrore(null)
                }}
                placeholder={`es. ${Math.max(1, Math.round((preferito.auto.prezzo * 0.95) / 100) * 100)}`}
                aria-invalid={errore ? true : undefined}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-7 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-notte-bordo dark:bg-notte-sfondo"
              />
            </div>
            <button
              type="submit"
              disabled={inCorso}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {avviso ? 'Salva' : 'Crea avviso'}
            </button>
          </div>
          {errore ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errore}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deve essere inferiore al prezzo attuale di {formattaPrezzo(preferito.auto.prezzo)}.
            </p>
          )}
          {modifica && (
            <button type="button" onClick={() => setModifica(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
              Annulla
            </button>
          )}
        </form>
      )}
    </div>
  )
}
