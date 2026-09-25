import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { erroriCampi, messaggioErrore } from '../api/client'
import { useAuth } from '../auth/authState'
import { CampoTesto } from '../components/form/CampoTesto'
import { Icona } from '../components/Icona'

// Stesse regole del BE (Validazione.java + RegisterRequestDto): il BE ricontrolla comunque tutto
const NOME_REGEX = /^\p{L}[\p{L} '-]*$/u
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Scheda = 'accedi' | 'registrati'

const PUNTI = [
  { icona: 'favorite', titolo: 'Salva le auto nei preferiti', testo: 'Ritrovi subito le vetture che ti interessano.' },
  { icona: 'trending_down', titolo: 'Avvisi quando il prezzo scende', testo: 'Scegli una soglia e ricevi notifica e mail.' },
  { icona: 'bolt', titolo: 'Notifiche in tempo reale', testo: 'Gli aggiornamenti arrivano mentre navighi.' },
]

// Rotte /login e /registrati: stessa pagina, scheda diversa
export function Accesso({ scheda }: { scheda: Scheda }) {
  const { utente } = useAuth()
  const location = useLocation()
  // Pagina da cui l'utente e' stato mandato al login (vedi RottaProtetta)
  const destinazione = (location.state as { da?: string } | null)?.da ?? '/'

  if (utente) return <Navigate to={destinazione} replace />

  const classeScheda = (attiva: boolean) =>
    `flex-1 border-b-2 pb-3 text-center text-base font-semibold transition-colors ${
      attiva
        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
    }`

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
      <aside className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block dark:border-notte-bordo dark:bg-notte-card">
        <div className="flex h-48 items-end bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-6 text-white">
          <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wider backdrop-blur">
            <Icona nome="verified_user" className="text-sm" />
            SPAZIO PERSONALE
          </span>
        </div>
        <div className="space-y-6 p-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Accedi al mondo Salone Auto</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Gestisci la tua ricerca, tieni d'occhio i prezzi e salva i veicoli che preferisci.
            </p>
          </div>
          <ul className="space-y-5 border-t border-slate-100 pt-6 dark:border-notte-bordo">
            {PUNTI.map((p) => (
              <li key={p.icona} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Icona nome={p.icona} className="text-xl" />
                </span>
                <span>
                  <span className="block font-semibold">{p.titolo}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{p.testo}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-notte-bordo dark:bg-notte-card">
        <nav className="mb-8 flex border-b border-slate-100 dark:border-notte-bordo" aria-label="Accesso o registrazione">
          <Link to="/login" state={location.state} replace className={classeScheda(scheda === 'accedi')} aria-current={scheda === 'accedi' ? 'page' : undefined}>
            Accedi
          </Link>
          <Link to="/registrati" state={location.state} replace className={classeScheda(scheda === 'registrati')} aria-current={scheda === 'registrati' ? 'page' : undefined}>
            Registrati
          </Link>
        </nav>
        {scheda === 'accedi' ? <FormAccedi destinazione={destinazione} /> : <FormRegistrati destinazione={destinazione} />}
      </div>
    </div>
  )
}

function PulsanteInvio({ inCorso, testo, icona }: { inCorso: boolean; testo: string; icona: string }) {
  return (
    <button
      type="submit"
      disabled={inCorso}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70"
    >
      {inCorso ? 'Attendere...' : testo}
      {!inCorso && <Icona nome={icona} className="text-lg" />}
    </button>
  )
}

function ErroreGenerale({ messaggio }: { messaggio: string | null }) {
  if (!messaggio) return null
  return (
    <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      <Icona nome="error" className="text-lg" />
      {messaggio}
    </p>
  )
}

function FormAccedi({ destinazione }: { destinazione: string }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrore(null)
    setInCorso(true)
    try {
      await login({ email: email.trim(), password })
      navigate(destinazione, { replace: true })
    } catch (err) {
      setErrore(messaggioErrore(err))
      setInCorso(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <ErroreGenerale messaggio={errore} />
      <CampoTesto etichetta="Email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} />
      <CampoTesto etichetta="Password" type="password" autoComplete="current-password" required maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
      <PulsanteInvio inCorso={inCorso} testo="Accedi" icona="arrow_forward" />
      <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500 dark:border-notte-bordo dark:text-slate-400">
        Non hai un account?{' '}
        <Link to="/registrati" replace className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
          Registrati
        </Link>
      </p>
    </form>
  )
}

interface DatiRegistrazione {
  nome: string
  cognome: string
  email: string
  password: string
}

function valida(d: DatiRegistrazione): Partial<Record<keyof DatiRegistrazione, string>> {
  const errori: Partial<Record<keyof DatiRegistrazione, string>> = {}
  for (const campo of ['nome', 'cognome'] as const) {
    const v = d[campo].trim()
    const etichetta = campo === 'nome' ? 'Il nome' : 'Il cognome'
    if (!v) errori[campo] = `${etichetta} è obbligatorio`
    else if (v.length > 50) errori[campo] = `${etichetta} può avere al massimo 50 caratteri`
    else if (!NOME_REGEX.test(v)) errori[campo] = `${etichetta} contiene caratteri non ammessi`
  }
  if (!d.email.trim()) errori.email = "L'email è obbligatoria"
  else if (!EMAIL_REGEX.test(d.email.trim())) errori.email = 'Formato email non valido'
  if (d.password.length < 8 || d.password.length > 72) errori.password = 'La password deve avere tra 8 e 72 caratteri'
  else if (!PASSWORD_REGEX.test(d.password)) errori.password = 'La password deve contenere almeno una lettera e un numero'
  return errori
}

function FormRegistrati({ destinazione }: { destinazione: string }) {
  const { registra, login } = useAuth()
  const navigate = useNavigate()
  const [dati, setDati] = useState<DatiRegistrazione>({ nome: '', cognome: '', email: '', password: '' })
  const [errori, setErrori] = useState<Partial<Record<keyof DatiRegistrazione, string>>>({})
  const [erroreGenerale, setErroreGenerale] = useState<string | null>(null)
  const [inCorso, setInCorso] = useState(false)

  const campo = (nome: keyof DatiRegistrazione) => ({
    value: dati[nome],
    errore: errori[nome],
    onChange: (e: { target: { value: string } }) => {
      setDati((d) => ({ ...d, [nome]: e.target.value }))
      setErrori((er) => ({ ...er, [nome]: undefined }))
    },
  })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErroreGenerale(null)
    const trovati = valida(dati)
    setErrori(trovati)
    if (Object.keys(trovati).length > 0) return

    const inviati = { nome: dati.nome.trim(), cognome: dati.cognome.trim(), email: dati.email.trim(), password: dati.password }
    setInCorso(true)
    try {
      await registra(inviati)
      // La registrazione non restituisce il token: si fa subito il login con le stesse credenziali
      await login({ email: inviati.email, password: inviati.password })
      navigate(destinazione, { replace: true })
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      if (status === 409) setErrori({ email: messaggioErrore(err) })
      else if (status === 400 && Object.keys(erroriCampi(err)).length > 0) setErrori(erroriCampi(err))
      else setErroreGenerale(messaggioErrore(err))
      setInCorso(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <ErroreGenerale messaggio={erroreGenerale} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoTesto etichetta="Nome" autoComplete="given-name" maxLength={50} {...campo('nome')} />
        <CampoTesto etichetta="Cognome" autoComplete="family-name" maxLength={50} {...campo('cognome')} />
      </div>
      <CampoTesto etichetta="Email" type="email" autoComplete="email" maxLength={255} {...campo('email')} />
      <CampoTesto
        etichetta="Password"
        type="password"
        autoComplete="new-password"
        maxLength={72}
        suggerimento="Almeno 8 caratteri, con almeno una lettera e un numero"
        {...campo('password')}
      />
      <PulsanteInvio inCorso={inCorso} testo="Crea account" icona="check_circle" />
      <p className="border-t border-slate-100 pt-5 text-center text-sm text-slate-500 dark:border-notte-bordo dark:text-slate-400">
        Hai già un account?{' '}
        <Link to="/login" replace className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
          Accedi
        </Link>
      </p>
    </form>
  )
}
