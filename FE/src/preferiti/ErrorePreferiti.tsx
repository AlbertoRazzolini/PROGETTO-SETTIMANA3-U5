import { useEffect } from 'react'
import { Icona } from '../components/Icona'
import { usePreferiti } from './preferitiState'

const DURATA_MS = 5000

// Messaggio a comparsa in basso per gli errori di cuore/rimozione (azioni senza un form dove mostrarli)
export function ErrorePreferiti() {
  const { errore, chiudiErrore } = usePreferiti()

  useEffect(() => {
    if (!errore) return
    const timer = setTimeout(chiudiErrore, DURATA_MS)
    return () => clearTimeout(timer)
  }, [errore, chiudiErrore])

  if (!errore) return null
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm shadow-lg dark:border-red-900/60 dark:bg-notte-card"
    >
      <Icona nome="error" className="text-xl text-red-600 dark:text-red-400" />
      <span className="flex-1">{errore}</span>
      <button type="button" onClick={chiudiErrore} aria-label="Chiudi" className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-notte-hover">
        <Icona nome="close" className="text-lg" />
      </button>
    </div>
  )
}
