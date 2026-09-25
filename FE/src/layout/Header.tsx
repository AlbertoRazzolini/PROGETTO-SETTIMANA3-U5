import { Link, NavLink } from 'react-router'
import { useAuth } from '../auth/authState'
import { usePreferiti } from '../preferiti/preferitiState'
import { Icona } from '../components/Icona'
import { PulsanteTema } from '../tema/PulsanteTema'

function classeLink({ isActive }: { isActive: boolean }) {
  const base = 'flex items-center gap-1.5 border-b-2 pb-1 text-sm font-semibold transition-colors'
  return isActive
    ? `${base} border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500`
    : `${base} border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100`
}

export function Header() {
  const { utente, logout } = useAuth()
  const { preferiti } = usePreferiti()
  const isAdmin = utente?.ruolo === 'ADMIN' || utente?.ruolo === 'SUPER_ADMIN'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white dark:border-notte-bordo dark:bg-notte-card dark:shadow-md">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-blue-600">
            <Icona nome="directions_car" className="text-2xl" />
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-lg font-bold tracking-tight">Salone Auto</span>
            <span className="text-[11px] font-medium tracking-wider text-slate-500 dark:text-slate-400">
              CONCESSIONARIA UFFICIALE
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 md:gap-6">
            <NavLink to="/" end className={classeLink}>
              <Icona nome="storefront" className="text-base" />
              <span className="hidden md:inline">Vetrina</span>
            </NavLink>
            {utente && (
              <NavLink to="/preferiti" className={classeLink}>
                <Icona nome="favorite" className="text-base" />
                <span className="hidden md:inline">Preferiti</span>
                {preferiti && preferiti.length > 0 && (
                  <span className="rounded-full bg-blue-50 px-1.5 text-[11px] font-bold text-blue-700 dark:border dark:border-blue-800/60 dark:bg-blue-950 dark:text-blue-300">
                    {preferiti.length}
                  </span>
                )}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={classeLink}>
                <Icona nome="admin_panel_settings" className="text-base" />
                <span className="hidden md:inline">Gestione</span>
              </NavLink>
            )}
          </div>

          <div className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-notte-bordo" />

          <div className="flex items-center gap-2 md:gap-3">
            {utente && (
              <Link
                to="/notifiche"
                aria-label="Notifiche"
                className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-notte-hover dark:hover:text-slate-100"
              >
                <Icona nome="notifications" className="text-xl" />
              </Link>
            )}
            <PulsanteTema />
            {utente ? (
              <div className="flex items-center gap-2">
                {/* Nome mostrato solo come testo: mai HTML proveniente da dati utente */}
                <span className="hidden max-w-40 truncate text-sm font-semibold lg:inline">{utente.nome}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 dark:border-notte-bordo dark:hover:bg-notte-hover"
                >
                  <Icona nome="logout" className="text-lg" />
                  <span className="hidden sm:inline">Esci</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 active:scale-[0.98]"
              >
                <Icona nome="person" className="text-lg" />
                Accedi
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
