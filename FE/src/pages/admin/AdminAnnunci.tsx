import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { elencoAutoAdmin, mettiInBozza, pubblicaAuto } from '../../api/admin'
import { ORDINAMENTI } from '../../api/auto'
import { messaggioErrore } from '../../api/client'
import type { AutoAdmin, Pagina, StatoPubblicazione } from '../../api/types'
import { PannelloModifica } from '../../components/admin/PannelloModifica'
import { PillolaPubblicazione } from '../../components/admin/PillolaPubblicazione'
import { BadgeStato, ImmagineAuto } from '../../components/auto/PartiAuto'
import { Icona } from '../../components/Icona'
import { Paginazione } from '../../components/Paginazione'
import { formattaData, formattaKm, formattaPrezzo } from '../../utils/formatta'

const FILTRI: { valore: StatoPubblicazione | ''; etichetta: string }[] = [
  { valore: '', etichetta: 'Tutti' },
  { valore: 'BOZZA', etichetta: 'Bozze' },
  { valore: 'PUBBLICATO', etichetta: 'Pubblicati' },
]
const SORT_VALIDI: string[] = ORDINAMENTI.map((o) => o.valore)

interface Risultato {
  chiave: string
  dati?: Pagina<AutoAdmin>
  errore?: string
}

export function AdminAnnunci() {
  const [params, setParams] = useSearchParams()
  const statoParam = params.get('stato')
  const stato: StatoPubblicazione | undefined = statoParam === 'BOZZA' || statoParam === 'PUBBLICATO' ? statoParam : undefined
  const paginaParam = Number(params.get('page'))
  const pagina = Number.isInteger(paginaParam) && paginaParam > 0 ? paginaParam : 0
  const sortParam = params.get('sort') ?? ''
  const sort = SORT_VALIDI.includes(sortParam) ? sortParam : ''

  const [versione, setVersione] = useState(0)
  const chiave = `${stato ?? ''}|${pagina}|${sort}|${versione}`
  const [risultato, setRisultato] = useState<Risultato | null>(null)
  const [bozze, setBozze] = useState<number | null>(null)
  const [aperta, setAperta] = useState<AutoAdmin | null>(null)
  const [erroreAzione, setErroreAzione] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    elencoAutoAdmin({ stato, page: pagina, sort: sort || undefined }, controller.signal)
      .then((dati) => setRisultato({ chiave, dati }))
      .catch((err) => {
        if (!controller.signal.aborted) setRisultato({ chiave, errore: messaggioErrore(err) })
      })
    // Numero di bozze per l'etichetta del filtro
    elencoAutoAdmin({ stato: 'BOZZA', page: 0 }, controller.signal)
      .then((d) => setBozze(d.totaleElementi))
      .catch(() => undefined)
    return () => controller.abort()
  }, [chiave, stato, pagina, sort])

  const dati = risultato?.dati
  const caricamento = risultato?.chiave !== chiave && !dati

  function imposta(modifiche: Record<string, string | undefined>) {
    const nuovi = new URLSearchParams(params)
    Object.entries(modifiche).forEach(([k, v]) => (v ? nuovi.set(k, v) : nuovi.delete(k)))
    setParams(nuovi)
  }

  // Aggiorna la riga e il pannello con la risposta del BE, poi riallinea elenco e conteggi
  const onAggiornato = useCallback((auto: AutoAdmin) => {
    setAperta((a) => (a && a.id === auto.id ? auto : a))
    setRisultato((r) =>
      r?.dati ? { ...r, dati: { ...r.dati, contenuto: r.dati.contenuto.map((x) => (x.id === auto.id ? auto : x)) } } : r,
    )
  }, [])

  const chiudiPannello = useCallback(() => {
    setAperta(null)
    setVersione((v) => v + 1)
  }, [])

  async function cambiaPubblicazione(auto: AutoAdmin) {
    setErroreAzione(null)
    setInCorso(auto.id)
    try {
      onAggiornato(await (auto.statoPubblicazione === 'PUBBLICATO' ? mettiInBozza(auto.id) : pubblicaAuto(auto.id)))
      setVersione((v) => v + 1)
    } catch (err) {
      setErroreAzione(`${auto.marca} ${auto.modello}: ${messaggioErrore(err)}`)
    } finally {
      setInCorso(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Annunci</h1>
        <Link
          to="/admin/importa"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <Icona nome="add" className="text-lg" />
          Importa nuovo annuncio
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra per pubblicazione">
          {FILTRI.map((f) => {
            const attivo = (stato ?? '') === f.valore
            return (
              <button
                key={f.valore || 'tutti'}
                type="button"
                aria-pressed={attivo}
                onClick={() => imposta({ stato: f.valore || undefined, page: undefined })}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  attivo
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-notte-bordo dark:bg-notte-card dark:hover:bg-notte-hover'
                }`}
              >
                {f.etichetta}
                {f.valore === 'BOZZA' && bozze !== null && bozze > 0 && (
                  <span className={`rounded-full px-1.5 text-[11px] font-bold ${attivo ? 'bg-white/25' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                    {bozze}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Ordina per</span>
          <select
            value={sort}
            onChange={(e) => imposta({ sort: e.target.value || undefined, page: undefined })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold outline-none focus:border-blue-500 dark:border-notte-bordo dark:bg-notte-card"
          >
            {ORDINAMENTI.map((o) => (
              <option key={o.valore} value={o.valore}>
                {o.etichetta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erroreAzione && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <Icona nome="error" className="text-lg" />
          {erroreAzione}
        </p>
      )}

      {caricamento && <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-notte-card" aria-busy="true" />}

      {!dati && risultato?.errore && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {risultato.errore}
        </p>
      )}

      {dati && dati.contenuto.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 dark:border-notte-bordo dark:bg-notte-card dark:text-slate-400">
          Nessun annuncio {stato === 'BOZZA' ? 'in bozza' : stato === 'PUBBLICATO' ? 'pubblicato' : ''}.
        </div>
      )}

      {dati && dati.contenuto.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-notte-bordo dark:bg-notte-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase dark:border-notte-bordo dark:bg-notte-hover dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Auto
                </th>
                <th scope="col" className="px-4 py-3">
                  Anno
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Km
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Prezzo
                </th>
                <th scope="col" className="px-4 py-3">
                  Stato
                </th>
                <th scope="col" className="px-4 py-3">
                  Pubblicazione
                </th>
                <th scope="col" className="px-4 py-3">
                  Aggiornato
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-notte-bordo">
              {dati.contenuto.map((a) => (
                <tr key={a.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md">
                        <ImmagineAuto src={a.immagini[0] ?? null} alt="" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold">
                          {a.marca} {a.modello}
                        </p>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{a.vin}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{a.anno}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{a.km !== null ? formattaKm(a.km) : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{a.prezzo !== null ? formattaPrezzo(a.prezzo) : '—'}</td>
                  <td className="px-4 py-3">{a.stato ? <BadgeStato stato={a.stato} /> : '—'}</td>
                  <td className="px-4 py-3">
                    <PillolaPubblicazione stato={a.statoPubblicazione} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">{formattaData(a.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAperta(a)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-notte-bordo dark:hover:bg-notte-hover"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        disabled={inCorso === a.id}
                        onClick={() => void cambiaPubblicazione(a)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap disabled:opacity-60 ${
                          a.statoPubblicazione === 'PUBBLICATO'
                            ? 'text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {a.statoPubblicazione === 'PUBBLICATO' ? 'Metti in bozza' : 'Pubblica'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dati && (
        <Paginazione
          pagina={dati.pagina}
          totalePagine={dati.totalePagine}
          onCambia={(p) => imposta({ page: p > 0 ? String(p) : undefined })}
        />
      )}

      {aperta && <PannelloModifica key={aperta.id} auto={aperta} onChiudi={chiudiPannello} onAggiornato={onAggiornato} />}
    </div>
  )
}
