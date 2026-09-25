import { Icona } from '../Icona'

// La scheda tecnica e' il JSON "vehicle" di auto.dev (chiavi in inglese).
// Si mostrano solo le voci note, in quest'ordine e con etichette italiane.
const VOCI: [chiave: string, etichetta: string][] = [
  ['trim', 'Allestimento'],
  ['bodyStyle', 'Carrozzeria'],
  ['engine', 'Motore'],
  ['cylinders', 'Cilindri'],
  ['transmission', 'Cambio'],
  ['drivetrain', 'Trazione'],
  ['doors', 'Porte'],
  ['seats', 'Posti'],
  ['exteriorColor', 'Colore esterno'],
  ['interiorColor', 'Colore interno'],
]

export function SchedaTecnica({ scheda, vin }: { scheda: Record<string, unknown> | null; vin: string }) {
  const righe = VOCI.flatMap(([chiave, etichetta]) => {
    const valore = scheda?.[chiave]
    return typeof valore === 'string' || typeof valore === 'number' ? [{ etichetta, valore: String(valore) }] : []
  })

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-notte-bordo dark:bg-notte-card">
      <h2 className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4 text-xl font-bold dark:border-notte-bordo">
        <Icona nome="tune" className="text-blue-600 dark:text-blue-400" />
        Scheda tecnica
      </h2>
      <dl className="overflow-hidden rounded-lg border border-slate-100 dark:border-notte-bordo">
        {righe.map(({ etichetta, valore }) => (
          <Riga key={etichetta} etichetta={etichetta} valore={valore} />
        ))}
        <Riga etichetta="Telaio (VIN)" valore={vin} mono />
      </dl>
    </section>
  )
}

function Riga({ etichetta, valore, mono = false }: { etichetta: string; valore: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 px-4 py-3 text-sm odd:bg-white even:bg-slate-50 dark:odd:bg-notte-card dark:even:bg-notte-hover">
      <dt className="text-slate-500 dark:text-slate-400">{etichetta}</dt>
      <dd className={`font-medium break-words ${mono ? 'font-mono' : ''}`}>{valore}</dd>
    </div>
  )
}
