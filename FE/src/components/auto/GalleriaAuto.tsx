import { useState } from 'react'
import { Icona } from '../Icona'
import { ImmagineAuto } from './PartiAuto'

// Foto grande 16:9 con frecce e contatore, miniature cliccabili sotto
export function GalleriaAuto({ immagini, titolo }: { immagini: string[]; titolo: string }) {
  const [indice, setIndice] = useState(0)
  const totale = immagini.length

  if (totale === 0) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-notte-bordo">
        <ImmagineAuto src={null} alt="" />
      </div>
    )
  }

  const vai = (nuovo: number) => setIndice((nuovo + totale) % totale)
  const classeFreccia =
    'absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition-colors hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900'

  return (
    <div className="space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-notte-bordo dark:bg-slate-900">
        <img
          src={immagini[indice]}
          alt={`${titolo} - foto ${indice + 1} di ${totale}`}
          className="size-full object-cover"
        />
        {totale > 1 && (
          <>
            <button type="button" onClick={() => vai(indice - 1)} aria-label="Foto precedente" className={`${classeFreccia} left-4`}>
              <Icona nome="chevron_left" className="text-2xl" />
            </button>
            <button type="button" onClick={() => vai(indice + 1)} aria-label="Foto successiva" className={`${classeFreccia} right-4`}>
              <Icona nome="chevron_right" className="text-2xl" />
            </button>
            <span className="absolute right-4 bottom-4 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">
              {indice + 1}/{totale}
            </span>
          </>
        )}
      </div>

      {totale > 1 && (
        <div className="flex snap-x gap-3 overflow-x-auto pb-1">
          {immagini.map((src, i) => (
            <button
              key={`${i}-${src}`}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Mostra foto ${i + 1}`}
              aria-current={i === indice}
              className={`aspect-[4/3] w-[calc((100%-3rem)/5)] min-w-20 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-all ${
                i === indice
                  ? 'border-blue-600 ring-2 ring-blue-600/20 dark:border-blue-500'
                  : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
