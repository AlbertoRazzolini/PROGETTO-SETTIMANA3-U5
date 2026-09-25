import { useState } from 'react'
import { Link } from 'react-router'
import type { Preferito } from '../api/types'
import { BadgeStato, ImmagineAuto, SpecificheAuto } from '../components/auto/PartiAuto'
import { Icona } from '../components/Icona'
import { Paginazione } from '../components/Paginazione'
import { BoxAvviso } from '../preferiti/BoxAvviso'
import { usePreferiti } from '../preferiti/preferitiState'
import { formattaData, formattaPrezzo } from '../utils/formatta'

// Stessa dimensione di pagina del BE; l'elenco completo e' gia' in memoria (PreferitiProvider)
const PER_PAGINA = 10

export function Preferiti() {
  const { preferiti, avvisi } = usePreferiti()
  const [pagina, setPagina] = useState(0)

  if (preferiti === null) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Caricamento">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-xl bg-slate-200 dark:bg-notte-card" />
        ))}
      </div>
    )
  }

  const totalePagine = Math.max(1, Math.ceil(preferiti.length / PER_PAGINA))
  // Se si rimuove l'ultimo elemento dell'ultima pagina si torna indietro di una
  const corrente = Math.min(pagina, totalePagine - 1)
  const visibili = preferiti.slice(corrente * PER_PAGINA, (corrente + 1) * PER_PAGINA)
  const avvisiAttivi = avvisi.filter((a) => a.attivo).length

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-notte-bordo">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">I miei preferiti</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {preferiti.length === 1 ? '1 auto salvata' : `${preferiti.length} auto salvate`}
          </p>
        </div>
        {avvisiAttivi > 0 && (
          <p className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <Icona nome="notifications_active" className="text-lg" />
            {avvisiAttivi === 1 ? '1 avviso di prezzo attivo' : `${avvisiAttivi} avvisi di prezzo attivi`}
          </p>
        )}
      </div>

      {preferiti.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-notte-bordo dark:bg-notte-card">
          <Icona nome="favorite" className="text-5xl text-slate-300 dark:text-slate-600" />
          <p className="text-lg font-semibold">Non hai ancora salvato nessuna auto</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tocca il cuore su un'auto della vetrina per ritrovarla qui.</p>
          <Link to="/" className="mt-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
            Vai alla vetrina
          </Link>
        </div>
      ) : (
        <ul className="space-y-6">
          {visibili.map((p) => (
            <li key={p.id}>
              <RigaPreferito preferito={p} />
            </li>
          ))}
        </ul>
      )}

      <Paginazione pagina={corrente} totalePagine={totalePagine} onCambia={setPagina} />
    </div>
  )
}

function RigaPreferito({ preferito }: { preferito: Preferito }) {
  const { rimuovi, inCorso } = usePreferiti()
  const { auto, disponibile } = preferito
  const titolo = `${auto.marca} ${auto.modello}`
  const occupato = inCorso(auto.id)

  const pulsanteRimuovi = (
    <button
      type="button"
      onClick={() => void rimuovi(preferito)}
      disabled={occupato}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-wait disabled:opacity-60 dark:border-notte-bordo dark:text-slate-300 dark:hover:text-red-400"
    >
      <Icona nome="delete" className="text-lg" />
      Rimuovi
    </button>
  )

  return (
    <article className="grid grid-cols-1 gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_320px] dark:border-notte-bordo dark:bg-notte-card">
      <div className={`relative aspect-video overflow-hidden rounded-lg md:aspect-auto md:min-h-40 ${disponibile ? '' : 'opacity-60 grayscale'}`}>
        <div className="absolute inset-0">
          <ImmagineAuto src={auto.immaginePrincipale} alt="" />
        </div>
        {disponibile ? (
          <BadgeStato stato={auto.stato} className="absolute top-3 left-3" />
        ) : (
          <span className="absolute top-3 left-3 rounded bg-slate-700 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase">
            Non disponibile
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-between gap-4">
        <div className={`space-y-3 ${disponibile ? '' : 'opacity-60'}`}>
          <h2 className="text-xl font-bold">
            {disponibile ? (
              <Link to={`/auto/${auto.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                {titolo}
              </Link>
            ) : (
              titolo
            )}
          </h2>
          <SpecificheAuto anno={auto.anno} carburante={auto.carburante} km={auto.km} className="flex-wrap gap-4" />
          {disponibile ? (
            <p className="text-3xl font-extrabold">{formattaPrezzo(auto.prezzo)}</p>
          ) : (
            <p className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 dark:bg-notte-hover dark:text-slate-300">
              <Icona nome="block" className="text-base" />
              Non più disponibile in vetrina
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-notte-bordo">
          <span className="text-sm text-slate-500 dark:text-slate-400">Salvata il {formattaData(preferito.createdAt)}</span>
          <div className="flex gap-2">
            {pulsanteRimuovi}
            {disponibile && (
              <Link
                to={`/auto/${auto.id}`}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-100 dark:border-notte-bordo dark:hover:bg-notte-hover"
              >
                Vedi dettagli
                <Icona nome="arrow_forward" className="text-lg" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {disponibile && (
        <div className="md:col-span-2 xl:col-span-1">
          <BoxAvviso preferito={preferito} compatto />
        </div>
      )}
    </article>
  )
}
