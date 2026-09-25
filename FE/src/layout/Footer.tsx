import { Link } from 'react-router'
import { Icona } from '../components/Icona'

// Contatti segnaposto: da sostituire con i dati reali del salone
export function Footer() {
  return (
    <footer className="mt-16 w-full border-t border-slate-200 bg-white dark:border-notte-bordo dark:bg-notte-card">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-8 border-b border-slate-200 pb-10 md:grid-cols-3 dark:border-notte-bordo">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-blue-600">
                <Icona nome="directions_car" className="text-xl" />
              </div>
              <span className="font-bold">Salone Auto</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Vetture nuove, km 0 e usate, selezionate e controllate dal nostro salone.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold">Contatti</h2>
            <ul className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <Icona nome="location_on" className="mt-0.5 text-base text-blue-600 dark:text-blue-400" />
                <span>Indirizzo del salone</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Icona nome="mail" className="text-base text-blue-600 dark:text-blue-400" />
                <span>info@example.com</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="font-bold">Link rapidi</h2>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  Vetrina auto
                </Link>
              </li>
              <li>
                <Link to="/preferiti" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  I miei preferiti
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="pt-8 text-center text-xs text-slate-500 md:text-left dark:text-slate-400">
          © {new Date().getFullYear()} Salone Auto - Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  )
}
