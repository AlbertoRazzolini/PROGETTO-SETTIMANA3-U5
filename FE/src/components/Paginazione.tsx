import { Icona } from './Icona'

// Numeri da mostrare: prima, ultima e le vicine a quella corrente; "..." dove si salta
function numeriPagina(corrente: number, totale: number): (number | '...')[] {
  const pagine = new Set([0, totale - 1, corrente - 1, corrente, corrente + 1])
  const valide = [...pagine].filter((p) => p >= 0 && p < totale).sort((a, b) => a - b)
  const risultato: (number | '...')[] = []
  valide.forEach((p, i) => {
    if (i > 0 && p - valide[i - 1] > 1) risultato.push('...')
    risultato.push(p)
  })
  return risultato
}

// "pagina" e' 0-based come nel BE; a video si mostra da 1
export function Paginazione({
  pagina,
  totalePagine,
  onCambia,
}: {
  pagina: number
  totalePagine: number
  onCambia: (pagina: number) => void
}) {
  if (totalePagine <= 1) return null

  const classeFreccia =
    'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:enabled:hover:bg-notte-hover'

  return (
    <nav aria-label="Paginazione" className="flex justify-center">
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-notte-bordo dark:bg-notte-card">
        <button type="button" disabled={pagina === 0} onClick={() => onCambia(pagina - 1)} className={classeFreccia}>
          <Icona nome="arrow_back" className="text-base" />
          <span className="hidden sm:inline">Precedente</span>
        </button>

        {numeriPagina(pagina, totalePagine).map((p, i) =>
          p === '...' ? (
            <span key={`salto-${i}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onCambia(p)}
              aria-current={p === pagina ? 'page' : undefined}
              className={`min-w-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                p === pagina
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-notte-hover'
              }`}
            >
              {p + 1}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={pagina >= totalePagine - 1}
          onClick={() => onCambia(pagina + 1)}
          className={classeFreccia}
        >
          <span className="hidden sm:inline">Successiva</span>
          <Icona nome="arrow_forward" className="text-base" />
        </button>
      </div>
    </nav>
  )
}
