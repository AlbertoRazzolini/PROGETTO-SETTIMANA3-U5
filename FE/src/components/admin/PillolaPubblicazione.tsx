import type { StatoPubblicazione } from '../../api/types'

export function PillolaPubblicazione({ stato }: { stato: StatoPubblicazione }) {
  const [testo, classe] =
    stato === 'PUBBLICATO'
      ? ['Pubblicato', 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300']
      : ['Bozza', 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300']
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${classe}`}>{testo}</span>
}
