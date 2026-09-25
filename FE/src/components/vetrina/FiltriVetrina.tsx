import { useState, type FormEvent } from 'react'
import { CARBURANTI } from '../../api/auto'
import type { StatoAuto } from '../../api/types'
import { ETICHETTA_STATO } from '../../utils/formatta'
import { Icona } from '../Icona'

export interface ValoriFiltri {
  stato: StatoAuto | ''
  carburante: string
  prezzoMin: string
  prezzoMax: string
}

const STATI: (StatoAuto | '')[] = ['', 'NUOVO', 'KM_0', 'USATO']

const classeCampo =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-notte-bordo dark:bg-notte-sfondo'

// Filtri in bozza: si applicano solo con "Applica filtri". Il genitore passa una key legata ai filtri
// dell'URL, cosi' la bozza si riallinea quando cambiano da fuori (es. "Azzera filtri", tasto indietro).
export function FiltriVetrina({
  iniziali,
  onApplica,
  onAzzera,
}: {
  iniziali: ValoriFiltri
  onApplica: (valori: ValoriFiltri) => void
  onAzzera: () => void
}) {
  const [bozza, setBozza] = useState(iniziali)
  const [errore, setErrore] = useState<string | null>(null)

  function aggiorna<K extends keyof ValoriFiltri>(campo: K, valore: ValoriFiltri[K]) {
    setBozza((b) => ({ ...b, [campo]: valore }))
    setErrore(null)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const min = bozza.prezzoMin === '' ? null : Number(bozza.prezzoMin)
    const max = bozza.prezzoMax === '' ? null : Number(bozza.prezzoMax)
    if (min !== null && max !== null && min > max) {
      setErrore('Il prezzo minimo non può superare il massimo')
      return
    }
    onApplica(bozza)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-notte-bordo dark:bg-notte-card"
    >
      <h2 className="flex items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold dark:border-notte-bordo">
        <Icona nome="tune" className="text-blue-600 dark:text-blue-400" />
        Filtri
      </h2>

      <fieldset>
        <legend className="mb-3 text-sm font-bold">Stato veicolo</legend>
        <div className="grid grid-cols-2 gap-2">
          {STATI.map((stato) => {
            const attivo = bozza.stato === stato
            return (
              <button
                key={stato || 'tutti'}
                type="button"
                aria-pressed={attivo}
                onClick={() => aggiorna('stato', stato)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  attivo
                    ? 'border-blue-600 bg-blue-600 font-bold text-white shadow-sm dark:border-blue-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-[#2a374f] dark:bg-notte-hover dark:text-slate-300 dark:hover:bg-[#1a2742]'
                }`}
              >
                {stato ? ETICHETTA_STATO[stato] : 'Tutti'}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="filtro-carburante" className="mb-3 block text-sm font-bold">
          Alimentazione
        </label>
        <select
          id="filtro-carburante"
          value={bozza.carburante}
          onChange={(e) => aggiorna('carburante', e.target.value)}
          className={classeCampo}
        >
          <option value="">Tutte</option>
          {CARBURANTI.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-bold">Budget di prezzo (€)</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="filtro-min" className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Minimo
            </label>
            <input
              id="filtro-min"
              type="number"
              min={0}
              step={500}
              inputMode="numeric"
              value={bozza.prezzoMin}
              onChange={(e) => aggiorna('prezzoMin', e.target.value)}
              className={classeCampo}
            />
          </div>
          <div>
            <label htmlFor="filtro-max" className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Massimo
            </label>
            <input
              id="filtro-max"
              type="number"
              min={0}
              step={500}
              inputMode="numeric"
              value={bozza.prezzoMax}
              onChange={(e) => aggiorna('prezzoMax', e.target.value)}
              className={classeCampo}
            />
          </div>
        </div>
        {errore && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errore}
          </p>
        )}
      </fieldset>

      <div className="space-y-3 border-t border-slate-100 pt-6 dark:border-notte-bordo">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Icona nome="check_circle" className="text-lg" />
          Applica filtri
        </button>
        <button
          type="button"
          onClick={onAzzera}
          className="w-full py-1 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          Azzera filtri
        </button>
      </div>
    </form>
  )
}
