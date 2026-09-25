import { useId, useState, type InputHTMLAttributes } from 'react'
import { Icona } from '../Icona'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  etichetta: string
  errore?: string
  suggerimento?: string
}

// Campo con etichetta, messaggio d'errore collegato (aria-describedby) e, per le password, pulsante mostra/nascondi
export function CampoTesto({ etichetta, errore, suggerimento, type = 'text', className = '', ...resto }: Props) {
  const id = useId()
  const [visibile, setVisibile] = useState(false)
  const password = type === 'password'
  const idDescrizione = errore || suggerimento ? `${id}-descrizione` : undefined

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-semibold">
        {etichetta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={password && visibile ? 'text' : type}
          aria-invalid={errore ? true : undefined}
          aria-describedby={idDescrizione}
          className={`w-full rounded-lg border bg-white px-3.5 py-3 text-sm outline-none focus:ring-2 dark:bg-notte-sfondo ${
            password ? 'pr-11' : ''
          } ${
            errore
              ? 'border-red-500 focus:ring-red-500/20 dark:border-red-400'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-notte-bordo'
          }`}
          {...resto}
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisibile((v) => !v)}
            aria-label={visibile ? 'Nascondi password' : 'Mostra password'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <Icona nome={visibile ? 'visibility_off' : 'visibility'} className="text-xl" />
          </button>
        )}
      </div>
      {errore ? (
        <p id={idDescrizione} className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <Icona nome="error" className="text-base" />
          {errore}
        </p>
      ) : (
        suggerimento && (
          <p id={idDescrizione} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Icona nome="info" className="text-sm" />
            {suggerimento}
          </p>
        )
      )}
    </div>
  )
}
