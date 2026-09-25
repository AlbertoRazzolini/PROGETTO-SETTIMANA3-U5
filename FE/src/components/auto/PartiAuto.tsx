import type { StatoAuto } from '../../api/types'
import { ETICHETTA_STATO, formattaKm } from '../../utils/formatta'
import { Icona } from '../Icona'

const COLORI_STATO: Record<StatoAuto, string> = {
  NUOVO:
    'bg-emerald-50 text-emerald-800 border-emerald-600/40 dark:bg-emerald-950/90 dark:text-emerald-300 dark:border-emerald-700/80',
  KM_0: 'bg-blue-50 text-blue-800 border-blue-600/40 dark:bg-blue-950/90 dark:text-blue-300 dark:border-blue-700/80',
  USATO: 'bg-white text-slate-700 border-slate-300 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-600/60',
}

export function BadgeStato({ stato, className = '' }: { stato: StatoAuto; className?: string }) {
  return (
    <span
      className={`rounded border px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase shadow-sm ${COLORI_STATO[stato]} ${className}`}
    >
      {ETICHETTA_STATO[stato]}
    </span>
  )
}

// Cuore dei preferiti. "sovrapposto" = sopra l'immagine (card normale), altrimenti nel testo (card in evidenza)
export function PulsantePreferito({
  attivo,
  onClick,
  sovrapposto = false,
  className = '',
}: {
  attivo: boolean
  onClick: () => void
  sovrapposto?: boolean
  className?: string
}) {
  const stile = sovrapposto
    ? 'bg-white/80 shadow backdrop-blur-md hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-900'
    : 'border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-[#2a374f] dark:bg-notte-hover dark:hover:bg-notte-bordo'
  const colore = attivo ? 'text-red-600 dark:text-red-400' : 'text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      aria-label={attivo ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
      className={`flex size-8 items-center justify-center rounded-full transition-colors ${stile} ${colore} ${className}`}
    >
      <Icona nome="favorite" piena={attivo} className="text-lg" />
    </button>
  )
}

// Immagine dell'auto con segnaposto se l'annuncio non ha foto
export function ImmagineAuto({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex size-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600">
        <Icona nome="directions_car" className="text-6xl" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  )
}

// Riga anno · carburante · km
export function SpecificheAuto({
  anno,
  carburante,
  km,
  className = '',
}: {
  anno: number
  carburante: string
  km: number
  className?: string
}) {
  const voci = [
    { icona: 'calendar_today', testo: String(anno) },
    { icona: 'local_gas_station', testo: carburante },
    { icona: 'speed', testo: formattaKm(km) },
  ]
  return (
    <div className={`flex items-center text-sm text-slate-500 dark:text-slate-400 ${className}`}>
      {voci.map((voce) => (
        <span key={voce.icona} className="flex items-center gap-1">
          <Icona nome={voce.icona} className="text-base text-slate-400 dark:text-slate-500" />
          {voce.testo}
        </span>
      ))}
    </div>
  )
}
