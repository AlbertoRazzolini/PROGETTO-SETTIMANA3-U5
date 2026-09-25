import { useEffect, useState } from 'react'
import { Icona } from '../Icona'
import { ImmagineAuto } from './PartiAuto'

// Foto grande 16:9 con frecce e contatore, miniature cliccabili sotto.
// auto.dev a volte restituisce URL che il suo server foto poi rifiuta (403): quelle foto vengono
// scartate appena il browser non riesce a caricarle, e il contatore conta solo le foto visibili.
export function GalleriaAuto({ immagini, titolo }: { immagini: string[]; titolo: string }) {
  const [indice, setIndice] = useState(0)
  const [rotte, setRotte] = useState<ReadonlySet<string>>(new Set())

  // Prova subito a caricare tutte le foto (le miniature fuori schermo sono lazy):
  // cosi' le rotte spariscono prima che l'utente ci arrivi e il contatore resta stabile
  useEffect(() => {
    let attivo = true
    const prove = immagini.map((src) => {
      const img = new Image()
      img.onerror = () => {
        if (attivo) segnaRotta(src)
      }
      img.src = src
      return img
    })
    return () => {
      attivo = false
      prove.forEach((img) => {
        img.onerror = null
      })
    }
  }, [immagini])

  function segnaRotta(src: string) {
    setRotte((r) => (r.has(src) ? r : new Set(r).add(src)))
  }

  const visibili = immagini.filter((src) => !rotte.has(src))
  const totale = visibili.length

  if (totale === 0) {
    return (
      <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 dark:border-notte-bordo">
        <ImmagineAuto src={null} alt="" />
      </div>
    )
  }

  // Se la foto mostrata viene scartata, si resta dentro i limiti delle foto rimaste
  const corrente = Math.min(indice, totale - 1)
  const vai = (nuovo: number) => setIndice((nuovo + totale) % totale)
  const classeFreccia =
    'absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md transition-colors hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900'

  return (
    <div className="min-w-0 space-y-4">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-notte-bordo dark:bg-slate-900">
        <img
          src={visibili[corrente]}
          alt={`${titolo} - foto ${corrente + 1} di ${totale}`}
          onError={() => segnaRotta(visibili[corrente])}
          className="size-full object-cover"
        />
        {totale > 1 && (
          <>
            <button type="button" onClick={() => vai(corrente - 1)} aria-label="Foto precedente" className={`${classeFreccia} left-4`}>
              <Icona nome="chevron_left" className="text-2xl" />
            </button>
            <button type="button" onClick={() => vai(corrente + 1)} aria-label="Foto successiva" className={`${classeFreccia} right-4`}>
              <Icona nome="chevron_right" className="text-2xl" />
            </button>
            <span className="absolute right-4 bottom-4 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">
              {corrente + 1}/{totale}
            </span>
          </>
        )}
      </div>

      {totale > 1 && (
        <div className="flex snap-x gap-3 overflow-x-auto pb-1">
          {visibili.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Mostra foto ${i + 1}`}
              aria-current={i === corrente}
              className={`aspect-[4/3] w-24 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-all sm:w-28 ${
                i === corrente
                  ? 'border-blue-600 ring-2 ring-blue-600/20 dark:border-blue-500'
                  : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <img src={src} alt="" loading="lazy" onError={() => segnaRotta(src)} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
