import { useEffect } from 'react'
import { Link } from 'react-router'
import type { Notifica } from '../api/types'
import { Icona } from '../components/Icona'
import { useNotifiche } from './notificheState'

const DURATA_MS = 8000

// Notifiche arrivate in tempo reale, in basso a destra; si chiudono da sole dopo qualche secondo
export function NotificheArrivate() {
  const { arrivate } = useNotifiche()
  if (arrivate.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
    >
      {arrivate.map((n) => (
        <Messaggio key={n.id} notifica={n} />
      ))}
    </div>
  )
}

function Messaggio({ notifica }: { notifica: Notifica }) {
  const { chiudiArrivata, segnaLetta } = useNotifiche()

  useEffect(() => {
    const timer = setTimeout(() => chiudiArrivata(notifica.id), DURATA_MS)
    return () => clearTimeout(timer)
  }, [notifica.id, chiudiArrivata])

  return (
    <div role="status" className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-notte-bordo dark:bg-notte-card">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
        <Icona nome="notifications_active" className="text-xl" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold">Nuova notifica</p>
        {/* Messaggio mostrato solo come testo */}
        <p className="text-sm text-slate-600 dark:text-slate-300">{notifica.messaggio}</p>
        <Link
          to={`/auto/${notifica.autoId}`}
          onClick={() => void segnaLetta(notifica).catch(() => chiudiArrivata(notifica.id))}
          className="inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          Vedi auto
        </Link>
      </div>
      <button
        type="button"
        onClick={() => chiudiArrivata(notifica.id)}
        aria-label="Chiudi notifica"
        className="self-start rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-notte-hover dark:hover:text-slate-200"
      >
        <Icona nome="close" className="text-lg" />
      </button>
    </div>
  )
}
