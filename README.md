# Mini Salone Auto

Web app full-stack per un piccolo salone di automobili. Gli annunci vengono importati da
[auto.dev](https://auto.dev) (mercato USA), convertiti in euro, km e italiano e pubblicati dagli admin.
Gli utenti consultano la vetrina, salvano i preferiti e impostano soglie di prezzo: quando il prezzo
scende ricevono una mail e una notifica in tempo reale.

| Parte | Cartella | Stack | Documentazione |
|---|---|---|---|
| Back-end | [`BE/`](BE) | Java 25 · Spring Boot 4.1 · Spring Security (JWT) · JPA · PostgreSQL · WebSocket/STOMP | [BE/README.md](BE/README.md) |
| Front-end | [`FE/`](FE) | React 19 · TypeScript · Vite · React Router · Axios · Tailwind CSS | [FE/README.md](FE/README.md) |

---

## Avvio rapido

Servono **Java 25**, **Node.js 20.19+ o 22.12+** (richiesto da Vite 8) e **PostgreSQL** con un database `db-PS3U5`
(default: utente `postgres`, password `1234`).

1. **Back-end** (porta 8080):
   ```bash
   cd BE
   ./mvnw spring-boot:run
   ```
   Al primo avvio vengono create le tabelle e i 3 utenti di prova.
2. **Front-end** (porta 5173), in un altro terminale:
   ```bash
   cd FE
   npm install
   npm run dev
   ```
3. Aprire **http://localhost:5173**.

La vetrina, i preferiti e le notifiche funzionano senza configurazioni aggiuntive. Per importare annunci
e inviare le mail servono delle variabili d'ambiente (tabella completa in [BE/README.md](BE/README.md#variabili-dambiente)):

| Variabile | Serve per |
|---|---|
| `AUTODEV_API_KEY` | Ricerca e import da auto.dev |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Mail degli avvisi di prezzo (Gmail, *password per le app*) |

Chiavi e password vanno solo nelle variabili d'ambiente, mai nel repository. Se il back-end si avvia da
IntelliJ, l'IDE va riaperto dopo aver creato le variabili, altrimenti non le vede.

### Utenti di prova

| Ruolo | Email | Password |
|---|---|---|
| USER | `user@example.com` | `User1234!` |
| ADMIN | `admin@example.com` | `Admin1234!` |
| SUPER_ADMIN | `superadmin@example.com` | `SuperAdmin1234!` |

---

## Cosa si può fare

**Visitatori**
- Vetrina con 10 auto per pagina, ricerca con suggerimenti dalla 3ª lettera, filtri per stato
  (nuovo, km 0, usato), carburante e prezzo, ordinamento.
- Scheda di ogni auto con galleria, descrizione e scheda tecnica.
- Registrazione e accesso.

**Utenti registrati**
- Preferiti, anche direttamente dal cuore sulle card.
- Avviso di prezzo su un preferito: sotto la soglia arrivano mail e notifica. Il link nella mail disattiva l'avviso.
- Notifiche in tempo reale (WebSocket) con badge sul campanello e storico.

**Admin**
- Gestione annunci: bozze e pubblicati, modifica di prezzo, km, stato e descrizione, pubblicazione.
- Import da auto.dev: ricerca a pagine, anteprima già localizzata, import di uno o più annunci come bozza.

**Super admin**
- Tutto quello dell'admin, più il cambio di ruolo degli utenti.

Tutta l'interfaccia è disponibile in modalità chiara e notte e funziona anche da telefono.

---

## auto.dev e consumo di chiamate

Il piano Free di auto.dev ha un numero limitato di chiamate, quindi il back-end le usa con parsimonia:

| Operazione | Chiamate |
|---|---|
| Una pagina di risultati di ricerca (fino a 20 annunci) | 1 |
| Anteprima di un annuncio (dati + foto) | 2 |
| Import di un annuncio | 2, oppure 0 se l'anteprima è stata aperta negli ultimi 30 minuti |
| Navigazione degli utenti in vetrina | 0: i dati importati sono salvati nel database |

---

## Sicurezza

Le protezioni previste (validazione degli input, ruoli, isolamento delle risorse per proprietario, difesa da
injection e XSS, CORS ristretto) sono state verificate simulando attacchi contro l'app in esecuzione su quattro
fronti — JWT/WebSocket, injection, XSS, controllo accessi/CORS — senza riuscire ad aggirarle. Dettagli e scelte
nella sezione [Sicurezza del back-end](BE/README.md#sicurezza-scelte-principali).

---

## Struttura del repository

```
├── BE/             back-end Spring Boot
│   ├── src/        codice e test
│   ├── http/       richieste di prova per l'HTTP Client di IntelliJ
│   └── postman/    collection Postman con test automatici
├── FE/             front-end React
│   └── src/        pagine, componenti, chiamate API
└── progettazione/  documento di progettazione (requisiti di partenza e note di realizzazione)
```

La grafica del front-end è stata progettata con Google Stitch e poi convertita in componenti React.
