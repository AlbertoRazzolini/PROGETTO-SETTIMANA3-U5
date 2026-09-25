import { Link } from 'react-router'
import { formattaPrezzo } from '../../utils/formatta'
import type { PropsCardAuto } from './CardAuto'
import { BadgeStato, ImmagineAuto, PulsantePreferito, SpecificheAuto } from './PartiAuto'

// Prima auto della pagina: card orizzontale a tutta larghezza, sopra la griglia 3x3 delle altre 9
export function CardAutoEvidenza({ auto, preferito = false, onPreferito, inCorso = false }: PropsCardAuto) {
  const titolo = `${auto.marca} ${auto.modello}`
  const dettaglio = `/auto/${auto.id}`

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md md:flex-row dark:border-notte-bordo dark:bg-notte-card dark:hover:border-slate-700">
      <Link
        to={dettaglio}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block min-h-[260px] w-full overflow-hidden md:min-h-[300px] md:w-[58%]"
      >
        <div className="absolute inset-0">
          <ImmagineAuto src={auto.immaginePrincipale} alt="" />
        </div>
      </Link>
      <div className="flex w-full flex-col justify-between space-y-6 p-6 md:w-[42%]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <BadgeStato stato={auto.stato} />
            {onPreferito && <PulsantePreferito attivo={preferito} onClick={onPreferito} disabilitato={inCorso} />}
          </div>
          <h2 className="text-2xl font-bold transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
            <Link to={dettaglio}>{titolo}</Link>
          </h2>
          <SpecificheAuto anno={auto.anno} carburante={auto.carburante} km={auto.km} className="mt-4 gap-4" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-notte-bordo">
          <span className="text-3xl font-extrabold">{formattaPrezzo(auto.prezzo)}</span>
          <Link
            to={dettaglio}
            className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-bold text-blue-600 transition-all duration-150 hover:bg-blue-600 hover:text-white dark:border dark:border-blue-900/40 dark:bg-notte-bordo dark:text-blue-400 dark:hover:bg-blue-600/20 dark:hover:text-blue-400"
          >
            Dettagli
          </Link>
        </div>
      </div>
    </article>
  )
}
