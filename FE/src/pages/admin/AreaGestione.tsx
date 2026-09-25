import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../../auth/authState'
import { Icona } from '../../components/Icona'

function classeScheda({ isActive }: { isActive: boolean }) {
  const base = 'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold whitespace-nowrap transition-colors'
  return isActive
    ? `${base} border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400`
    : `${base} border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100`
}

// Contenitore delle pagine /admin/*: sotto-navigazione comune. L'accesso e' gia' filtrato da RottaProtetta.
export function AreaGestione() {
  const { utente } = useAuth()
  const superAdmin = utente?.ruolo === 'SUPER_ADMIN'

  return (
    <div className="space-y-8">
      <nav aria-label="Area gestione" className="flex gap-6 overflow-x-auto border-b border-slate-200 dark:border-notte-bordo">
        <NavLink to="/admin" end className={classeScheda}>
          <Icona nome="directions_car" className="text-lg" />
          Annunci
        </NavLink>
        <NavLink to="/admin/importa" className={classeScheda}>
          <Icona nome="cloud_download" className="text-lg" />
          Importa da auto.dev
        </NavLink>
        {superAdmin && (
          <NavLink to="/admin/utenti" className={classeScheda}>
            <Icona nome="group" className="text-lg" />
            Utenti
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-violet-700 uppercase dark:bg-violet-950 dark:text-violet-300">
              Super admin
            </span>
          </NavLink>
        )}
      </nav>
      <Outlet />
    </div>
  )
}
