# Mini Salone Auto — Front-end

Interfaccia React del mini salone di automobili. Si appoggia al back-end in [`../BE`](../BE/README.md)
per vetrina, preferiti, avvisi di prezzo, notifiche in tempo reale e area di gestione per admin e super-admin.
Grafica progettata su Google Stitch (progetto "Salone Auto"), con modalità chiara e notte.

**Stack:** React 19 · TypeScript 6 · Vite 8 · React Router 8 · Axios · @stomp/stompjs (WebSocket) ·
Tailwind CSS 4 · font Plus Jakarta Sans e icone Material Symbols (Google Fonts).

---

## Avvio

1. Avviare il back-end (vedi [BE/README.md](../BE/README.md)): deve rispondere su `http://localhost:8080`.
2. Installare le dipendenze e avviare il server di sviluppo:
   ```bash
   npm install
   npm run dev
   ```
3. Aprire **http://localhost:5173**. È l'origine ammessa dal CORS e dal WebSocket del back-end
   (`ALLOWED_ORIGIN`) e quella usata nei link delle mail (`FRONTEND_URL`): se si cambia porta vanno
   aggiornate anche quelle variabili.

Altri comandi:

| Comando | Cosa fa |
|---|---|
| `npm run build` | Controllo dei tipi TypeScript e build di produzione in `dist/` |
| `npm run preview` | Serve la build di produzione in locale |
| `npm run lint` | ESLint (regole React Hooks comprese) |

### Configurazione

Copiare `.env.example` in `.env` solo se il back-end non è su `localhost:8080`:

| Variabile | Default | Note |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Base di REST (`/api`) e WebSocket (`/ws`, `ws://` o `wss://` in automatico) |

### Utenti di prova (seeder del back-end)

| Ruolo       | Email                    | Password          | Cosa vede in più |
|-------------|--------------------------|-------------------|---|
| USER        | `user@example.com`       | `User1234!`       | Preferiti, avvisi, notifiche |
| ADMIN       | `admin@example.com`      | `Admin1234!`      | Gestione annunci e import da auto.dev |
| SUPER_ADMIN | `superadmin@example.com` | `SuperAdmin1234!` | Anche la gestione dei ruoli utenti |

---

## Pagine

| Rotta | Accesso | Contenuto |
|---|---|---|
| `/` | tutti | Vetrina: ricerca con suggerimenti dalla 3ª lettera, filtri (stato, carburante, prezzo), ordinamento, 10 auto per pagina (1 in evidenza + griglia 3×3) |
| `/auto/:id` | tutti | Dettaglio: galleria, dati, descrizione, scheda tecnica, preferiti e avviso di prezzo. È la rotta linkata dalle mail |
| `/login`, `/registrati` | ospiti | Accesso e registrazione (dopo la registrazione il login è automatico) |
| `/preferiti` | utenti | Auto salvate con box dell'avviso di prezzo (crea, modifica soglia, elimina) |
| `/notifiche` | utenti | Storico notifiche, filtro non lette, segna come lette |
| `/admin` | ADMIN, SUPER_ADMIN | Annunci con bozze: modifica (prezzo, km, stato, descrizione), pubblica, metti in bozza |
| `/admin/importa` | ADMIN, SUPER_ADMIN | Ricerca su auto.dev, anteprima già in euro/km/italiano, import come bozza |
| `/admin/utenti` | SUPER_ADMIN | Elenco utenti per ruolo e cambio ruolo (non il proprio) |
| qualsiasi altra | tutti | Pagina 404 |

I filtri della vetrina e dell'elenco annunci stanno nell'URL (`/?q=golf&stato=USATO&page=2`):
i link si possono condividere e il tasto indietro del browser funziona.

---

## Scelte principali

- **Autenticazione.** Il JWT del login è salvato in `localStorage` e aggiunto a ogni richiesta da un
  interceptor Axios; un 401 chiude la sessione. Il ruolo mostrato viene sempre riletto da
  `GET /api/utenti/me` e non dal token, perché il super-admin può cambiarlo dopo il login.
  Le rotte protette sono solo un aiuto all'interfaccia: i permessi veri li controlla il back-end.
- **Preferiti e avvisi.** Il back-end non ha un endpoint "questa auto è tra i miei preferiti?", quindi al login
  il front-end scarica tutte le pagine di preferiti e avvisi e le tiene in un contesto React condiviso:
  cuore in vetrina, dettaglio, pagina Preferiti e contatore nell'header restano allineati.
  L'avviso si crea su un preferito, per questo nel dettaglio compare solo dopo aver salvato l'auto.
- **Notifiche in tempo reale.** Client STOMP su `/ws` con il JWT nel frame `CONNECT` e iscrizione a
  `/user/queue/notifiche`. All'arrivo di una notifica: badge del campanello, messaggio a comparsa e
  ricarica dei preferiti (il prezzo è cambiato). A ogni riconnessione il conteggio viene riletto da
  `/api/notifiche/conteggio`.
- **Validazione.** I form applicano le stesse regole dei DTO del back-end (nome, password, soglie, prezzi,
  km, descrizione) per dare subito l'errore sul campo; gli errori del back-end (`campi`, 409, …)
  vengono comunque mostrati accanto al campo giusto.
- **Sicurezza dei contenuti.** Descrizioni, nomi utente e messaggi delle notifiche sono mostrati solo
  come testo: nel progetto non c'è nessun `dangerouslySetInnerHTML`.
- **Modalità notte.** Classe `dark` su `<html>` con le varianti `dark:` di Tailwind. Senza una scelta
  salvata segue il tema del sistema; uno script in `index.html` la applica prima del primo render
  per evitare il lampo di tema chiaro.

---

## Struttura

```
src/
├── api/          chiamate REST (Axios) e tipi dei DTO del back-end
├── auth/         contesto di autenticazione e rotte protette
├── preferiti/    contesto di preferiti e avvisi, box "Avviso di prezzo"
├── notifiche/    contesto STOMP e messaggi a comparsa
├── tema/         modalità chiara/notte
├── layout/       header, footer, layout comune
├── components/   card auto, galleria, scheda tecnica, paginazione, campi dei form, pannello admin
├── pages/        una pagina per rotta (admin/ per l'area gestione)
└── utils/        formattazione di prezzi, km e date in it-IT
```
