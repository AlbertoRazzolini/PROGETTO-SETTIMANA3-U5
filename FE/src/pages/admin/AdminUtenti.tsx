import { useEffect, useState } from 'react'
import { cambiaRuolo, elencoUtenti } from '../../api/admin'
import { messaggioErrore } from '../../api/client'
import type { Pagina, Ruolo, Utente } from '../../api/types'
import { useAuth } from '../../auth/authState'
import { Icona } from '../../components/Icona'
import { Paginazione } from '../../components/Paginazione'
import { formattaData } from '../../utils/formatta'

const RUOLI: Ruolo[] = ['USER', 'ADMIN', 'SUPER_ADMIN']
const ETICHETTA_RUOLO: Record<Ruolo, string> = { USER: 'User', ADMIN: 'Admin', SUPER_ADMIN: 'Super admin' }
const COLORE_RUOLO: Record<Ruolo, string> = {
  USER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  ADMIN: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  SUPER_ADMIN: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
}

interface Risultato {
  chiave: string
  dati?: Pagina<Utente>
  errore?: string
}

// Solo SUPER_ADMIN: elenco utenti per ruolo e cambio ruolo (non il proprio: il BE risponde 400)
export function AdminUtenti() {
  const { utente: io } = useAuth()
  const [filtro, setFiltro] = useState<Ruolo | undefined>(undefined)
  const [pagina, setPagina] = useState(0)
  const chiave = `${filtro ?? ''}|${pagina}`
  const [risultato, setRisultato] = useState<Risultato | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    elencoUtenti(filtro, pagina, controller.signal)
      .then((dati) => setRisultato({ chiave, dati }))
      .catch((err) => {
        if (!controller.signal.aborted) setRisultato({ chiave, errore: messaggioErrore(err) })
      })
    return () => controller.abort()
  }, [chiave, filtro, pagina])

  const dati = risultato?.dati
  const caricamento = risultato?.chiave !== chiave && !dati

  function aggiornaRiga(aggiornato: Utente) {
    setRisultato((r) =>
      r?.dati ? { ...r, dati: { ...r.dati, contenuto: r.dati.contenuto.map((u) => (u.id === aggiornato.id ? aggiornato : u)) } } : r,
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Utenti</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Solo il super admin può cambiare i ruoli. Il tuo ruolo non è modificabile.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra per ruolo">
        {[undefined, ...RUOLI].map((r) => {
          const attivo = filtro === r
          return (
            <button
              key={r ?? 'tutti'}
              type="button"
              aria-pressed={attivo}
              onClick={() => {
                setFiltro(r)
                setPagina(0)
              }}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                attivo
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-notte-bordo dark:bg-notte-card dark:hover:bg-notte-hover'
              }`}
            >
              {r ? ETICHETTA_RUOLO[r] : 'Tutti'}
            </button>
          )
        })}
      </div>

      {caricamento && <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-notte-card" aria-busy="true" />}

      {!dati && risultato?.errore && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {risultato.errore}
        </p>
      )}

      {dati && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-notte-bordo dark:bg-notte-card">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:border-notte-bordo dark:bg-notte-hover dark:text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3">Utente</th>
                <th scope="col" className="px-5 py-3">Email</th>
                <th scope="col" className="px-5 py-3">Registrato il</th>
                <th scope="col" className="px-5 py-3">Ruolo attuale</th>
                <th scope="col" className="px-5 py-3 text-right">Modifica ruolo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-notte-bordo">
              {dati.contenuto.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500 dark:text-slate-400">
                    Nessun utente con questo ruolo.
                  </td>
                </tr>
              )}
              {dati.contenuto.map((u) => (
                <RigaUtente key={u.id} utente={u} sonoIo={u.id === io?.id} onAggiornato={aggiornaRiga} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dati && <Paginazione pagina={dati.pagina} totalePagine={dati.totalePagine} onCambia={setPagina} />}
    </div>
  )
}

function RigaUtente({ utente, sonoIo, onAggiornato }: { utente: Utente; sonoIo: boolean; onAggiornato: (u: Utente) => void }) {
  const [scelto, setScelto] = useState<Ruolo>(utente.ruolo)
  const [stato, setStato] = useState<{ tipo: 'ok' | 'errore'; testo: string } | null>(null)
  const [inCorso, setInCorso] = useState(false)
  const iniziali = `${utente.nome[0] ?? ''}${utente.cognome[0] ?? ''}`.toUpperCase()
  const modificato = scelto !== utente.ruolo

  async function salva() {
    setInCorso(true)
    setStato(null)
    try {
      const aggiornato = await cambiaRuolo(utente.id, scelto)
      onAggiornato(aggiornato)
      setStato({ tipo: 'ok', testo: 'Ruolo aggiornato' })
    } catch (err) {
      setStato({ tipo: 'errore', testo: messaggioErrore(err) })
    } finally {
      setInCorso(false)
    }
  }

  return (
    <tr className="align-middle">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {iniziali}
          </span>
          {/* Nome e cognome solo come testo */}
          <span className="font-semibold">
            {utente.nome} {utente.cognome}
          </span>
          {sonoIo && <span className="rounded border border-blue-200 bg-blue-50 px-1.5 text-[11px] font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">Tu</span>}
        </div>
      </td>
      <td className="px-5 py-3 font-mono text-xs">{utente.email}</td>
      <td className="px-5 py-3 whitespace-nowrap">{formattaData(utente.createdAt)}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${COLORE_RUOLO[utente.ruolo]}`}>{ETICHETTA_RUOLO[utente.ruolo]}</span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-2">
          {stato && (
            <span
              role={stato.tipo === 'errore' ? 'alert' : 'status'}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
                stato.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              <Icona nome={stato.tipo === 'ok' ? 'check' : 'error'} className="text-sm" />
              {stato.testo}
            </span>
          )}
          {sonoIo ? (
            <span className="text-xs text-slate-500 italic dark:text-slate-400">Non modificabile</span>
          ) : (
            <>
              <label className="sr-only" htmlFor={`ruolo-${utente.id}`}>
                Nuovo ruolo per {utente.nome} {utente.cognome}
              </label>
              <select
                id={`ruolo-${utente.id}`}
                value={scelto}
                onChange={(e) => {
                  setScelto(e.target.value as Ruolo)
                  setStato(null)
                }}
                className={`rounded-lg border bg-white px-3 py-1.5 text-sm outline-none dark:bg-notte-sfondo ${
                  modificato ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-200 dark:border-notte-bordo'
                }`}
              >
                {RUOLI.map((r) => (
                  <option key={r} value={r}>
                    {ETICHETTA_RUOLO[r]}
                  </option>
                ))}
              </select>
              {modificato && (
                <button
                  type="button"
                  onClick={() => void salva()}
                  disabled={inCorso}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  Salva
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
