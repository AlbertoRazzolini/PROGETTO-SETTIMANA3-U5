import { Icona } from '../components/Icona'
import { useTema } from './tema'

export function PulsanteTema() {
  const { tema, cambiaTema } = useTema()
  const scuro = tema === 'scuro'

  return (
    <button
      type="button"
      onClick={cambiaTema}
      aria-label={scuro ? "Attiva modalita' chiara" : "Attiva modalita' notte"}
      title={scuro ? "Modalita' chiara" : "Modalita' notte"}
      className="flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-amber-400 dark:hover:bg-slate-700 dark:hover:text-amber-300"
    >
      <Icona nome={scuro ? 'light_mode' : 'dark_mode'} className="text-lg" />
    </button>
  )
}
