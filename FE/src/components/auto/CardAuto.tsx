import { Link } from 'react-router'
import type { AutoCard } from '../../api/types'
import { formattaPrezzo } from '../../utils/formatta'
import { BadgeStato, ImmagineAuto, PulsantePreferito, SpecificheAuto } from './PartiAuto'

export interface PropsCardAuto {
  auto: AutoCard
  // Il cuore compare solo se viene passato onPreferito (utente loggato)
  preferito?: boolean
  onPreferito?: () => void
}

export function CardAuto({ auto, preferito = false, onPreferito }: PropsCardAuto) {
  const titolo = `${auto.marca} ${auto.modello}`
  const dettaglio = `/auto/${auto.id}`

  return (
    <article className="group flex h-full flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-notte-bordo dark:bg-notte-card dark:hover:border-slate-700">
      <div>
        <div className="relative aspect-video w-full overflow-hidden">
          <Link to={dettaglio} tabIndex={-1} aria-hidden="true">
            <ImmagineAuto src={auto.immaginePrincipale} alt="" />
          </Link>
          <BadgeStato stato={auto.stato} className="absolute top-3 left-3" />
          {onPreferito && (
            <PulsantePreferito attivo={preferito} onClick={onPreferito} sovrapposto className="absolute top-3 right-3" />
          )}
        </div>
        <div className="space-y-3 p-5">
          <h3 className="text-lg font-bold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
            <Link to={dettaglio}>{titolo}</Link>
          </h3>
          <SpecificheAuto
            anno={auto.anno}
            carburante={auto.carburante}
            km={auto.km}
            className="justify-between border-t border-slate-100 pt-2 dark:border-notte-bordo"
          />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 pt-3 pb-5 dark:border-notte-bordo">
        <span className="text-2xl font-extrabold">{formattaPrezzo(auto.prezzo)}</span>
        <Link
          to={dettaglio}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-blue-600 transition-all duration-150 hover:bg-blue-600 hover:text-white dark:border dark:border-blue-900/40 dark:bg-notte-bordo dark:text-blue-400 dark:hover:bg-blue-600/20 dark:hover:text-blue-400"
        >
          Dettagli
        </Link>
      </div>
    </article>
  )
}
