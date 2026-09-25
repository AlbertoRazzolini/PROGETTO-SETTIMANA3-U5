import { useEffect, useId, useState, type FormEvent, type KeyboardEvent } from 'react'
import { MIN_LETTERE_SUGGERIMENTI, suggerimentiAuto } from '../../api/auto'
import { Icona } from '../Icona'

const ATTESA_MS = 250

// Ricerca con menu di suggerimenti (dalla 3a lettera). Il testo iniziale arriva dall'URL:
// il genitore passa key={q} per riallinearla quando la ricerca cambia da fuori (es. "Azzera filtri").
export function BarraRicerca({ valoreIniziale, onCerca }: { valoreIniziale: string; onCerca: (q: string) => void }) {
  const [testo, setTesto] = useState(valoreIniziale)
  const [suggerimenti, setSuggerimenti] = useState<{ per: string; voci: string[] }>({ per: '', voci: [] })
  const [aperto, setAperto] = useState(false)
  const [evidenziato, setEvidenziato] = useState(-1)
  const idLista = useId()

  const cercato = testo.trim()

  // Chiamata ai suggerimenti con un piccolo ritardo, annullata se l'utente continua a scrivere
  useEffect(() => {
    if (cercato.length < MIN_LETTERE_SUGGERIMENTI) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      suggerimentiAuto(cercato, controller.signal)
        .then((voci) => setSuggerimenti({ per: cercato, voci }))
        .catch(() => {
          // suggerimenti non essenziali: in caso di errore semplicemente non compaiono
        })
    }, ATTESA_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [cercato])

  // Si mostrano solo i suggerimenti relativi al testo attuale
  const voci = cercato.length >= MIN_LETTERE_SUGGERIMENTI && suggerimenti.per === cercato ? suggerimenti.voci : []
  const menuVisibile = aperto && voci.length > 0

  function conferma(valore: string) {
    setTesto(valore)
    setAperto(false)
    setEvidenziato(-1)
    onCerca(valore.trim())
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    conferma(menuVisibile && evidenziato >= 0 ? voci[evidenziato] : testo)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!menuVisibile) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setEvidenziato((i) => (i + 1) % voci.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setEvidenziato((i) => (i <= 0 ? voci.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setAperto(false)
    }
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pl-4 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-notte-bordo dark:bg-notte-sfondo">
        <Icona nome="search" className="text-2xl text-blue-600 dark:text-blue-400" />
        <input
          type="search"
          value={testo}
          onChange={(e) => {
            setTesto(e.target.value)
            setAperto(true)
            setEvidenziato(-1)
          }}
          onFocus={() => setAperto(true)}
          // il click su un suggerimento non toglie il focus (onMouseDown sotto), quindi qui si puo' chiudere subito
          onBlur={() => setAperto(false)}
          onKeyDown={onKeyDown}
          maxLength={50}
          placeholder="Cerca marca o modello..."
          aria-label="Cerca marca o modello"
          role="combobox"
          aria-expanded={menuVisibile}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={evidenziato >= 0 ? `${idLista}-${evidenziato}` : undefined}
          className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
        >
          <Icona nome="search" className="text-lg" />
          <span className="hidden sm:inline">Cerca</span>
        </button>
      </div>

      {menuVisibile && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-notte-bordo dark:bg-notte-card"
        >
          {voci.map((voce, i) => (
            <li
              key={voce}
              id={`${idLista}-${i}`}
              role="option"
              aria-selected={i === evidenziato}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => conferma(voce)}
              className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors ${
                i === evidenziato ? 'bg-slate-100 dark:bg-notte-hover' : 'hover:bg-slate-50 dark:hover:bg-notte-hover'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Icona nome="directions_car" className="text-lg" />
                </span>
                <span className="font-medium">{voce}</span>
              </span>
              <Icona nome="arrow_forward" className="text-slate-400" />
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
