import { Link } from 'react-router'
import { Icona } from '../components/Icona'

export function NonTrovata() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-notte-bordo dark:bg-notte-card">
      <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">ERRORE 404</span>
      <Icona nome="wrong_location" className="text-6xl text-slate-300 dark:text-slate-600" />
      <h1 className="text-2xl font-bold">Pagina non trovata</h1>
      <p className="text-slate-500 dark:text-slate-400">L'indirizzo che hai aperto non esiste. Controlla il link o torna alla vetrina.</p>
      <Link to="/" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
        Torna alla vetrina
      </Link>
    </div>
  )
}
