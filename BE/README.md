# Mini Salone Auto — Back-end

API REST + WebSocket per un mini salone di automobili. Gli annunci vengono importati da
[auto.dev](https://auto.dev), convertiti in euro/km/italiano e gestiti dagli admin; gli utenti
consultano la vetrina, salvano i preferiti e impostano soglie di prezzo con avviso via mail
e notifica in tempo reale.

**Stack:** Java 25 · Spring Boot 4.1 · Spring Security 7 (JWT, BCrypt) · Spring Data JPA · PostgreSQL ·
WebSocket/STOMP · Thymeleaf (template mail) · JavaMail (Gmail SMTP) · jjwt.

---

## Avvio

1. PostgreSQL in esecuzione con un database `db-PS3U5` (default: utente `postgres`, password `1234`).
2. Variabili d'ambiente (vedi sotto): per le funzioni base non serve nulla; per auto.dev e le mail sì.
3. Avvio:
   ```bash
   ./mvnw spring-boot:run
   ```
   Le tabelle vengono create da Hibernate (`ddl-auto=update`) e il seeder crea i 3 utenti di prova.
4. Richieste di prova pronte:
   - **Postman:** importare [`postman/salone.postman_collection.json`](postman/salone.postman_collection.json)
     e lanciarla con il *Collection Runner*. 80 richieste in 10 cartelle; ogni richiesta verifica lo status
     atteso (anche 400/401/403/404/409) e salva token e id nelle variabili della collection. L'ultima
     cartella ripristina i dati, quindi si può rilanciare. La cartella *03 - auto.dev* consuma crediti API.
   - **IntelliJ:** [`http/salone.http`](http/salone.http) (HTTP Client).

### Utenti di prova (seeder)

| Ruolo       | Email                    | Password          |
|-------------|--------------------------|-------------------|
| USER        | `user@example.com`       | `User1234!`       |
| ADMIN       | `admin@example.com`      | `Admin1234!`      |
| SUPER_ADMIN | `superadmin@example.com` | `SuperAdmin1234!` |

Le email sono sul dominio riservato `example.com`, quindi le mail di avviso non arrivano a nessuno.
Per riceverle davvero registrare un utente con il proprio indirizzo, oppure impostare `SEED_*_EMAIL`
prima del primo avvio.

### Variabili d'ambiente

| Variabile | Default | Note |
|---|---|---|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | `jdbc:postgresql://localhost:5432/db-PS3U5` / `postgres` / `1234` | |
| `AUTODEV_API_KEY` | — | **Obbligatoria** per importare annunci da auto.dev |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | — | Account Gmail e *password per le app*: **mai nel repository** |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_FROM` | `smtp.gmail.com` / `587` / … | |
| `JWT_SECRET` / `JWT_EXPIRATION` | valore didattico / 1 settimana | In produzione solo da variabile d'ambiente |
| `ALLOWED_ORIGIN` / `FRONTEND_URL` / `BACKEND_URL` | `http://localhost:5173` / `…5173` / `…8080` | CORS, WebSocket e link nelle mail |
| `SEED_{USER,ADMIN,SUPERADMIN}_{EMAIL,PASSWORD}` | vedi tabella utenti | Usate solo alla creazione degli utenti |

---

## Modello dati

- **User** — id, nome, cognome, email (unique), password (hash BCrypt), ruolo (`USER`, `ADMIN`, `SUPER_ADMIN`), created_at
- **Auto** — id, listing_id (unique, auto.dev), vin, marca, modello, anno, carburante, descrizione (IT),
  scheda_tecnica (jsonb), immagini (tabella `auto_immagini`), km (max 6 cifre), prezzo (decimal 9,2),
  stato (`NUOVO`, `KM_0`, `USATO`), stato_pubblicazione (`BOZZA`, `PUBBLICATO`), created_at, updated_at
- **Preferito** — tabella di mezzo User ↔ Auto (unique user+auto)
- **Avviso** — soglia di prezzo su un preferito (relazione 1 — 0..1, `ON DELETE CASCADE`):
  soglia, soglia_ultima_notifica, attivo, token_disattivazione
- **Notifica** — storico notifiche dell'utente (messaggio, letta)

---

## Endpoint

Tutte le risposte di errore hanno lo stesso formato:
`{ "timestamp", "status", "errore", "messaggio", "campi"? }` (`campi` solo per errori di validazione).
Le liste paginate restituiscono `{ "contenuto", "pagina", "dimensione", "totaleElementi", "totalePagine" }`.

### Autenticazione — pubblici
| Metodo | Path | Status |
|---|---|---|
| POST | `/api/auth/register` | 201 · 400 · 409 |
| POST | `/api/auth/login` | 200 (token JWT) · 401 |

### Profilo — utente autenticato
| Metodo | Path | Status |
|---|---|---|
| GET | `/api/utenti/me` | 200 |
| PUT | `/api/utenti/me` | 200 · 400 |
| PATCH | `/api/utenti/me/password` | 204 · 400 |

### Vetrina — pubblici
| Metodo | Path | Note |
|---|---|---|
| GET | `/api/auto` | `q`, `stato`, `carburante`, `prezzoMin`, `prezzoMax`, `page`, `sort` · 10 per pagina · solo pubblicate |
| GET | `/api/auto/suggerimenti?q=` | almeno 3 caratteri · max 8 "Marca Modello" |
| GET | `/api/auto/{id}` | 404 se in bozza |

`sort` ammessi: `prezzo`, `km`, `anno`, `marca`, `data`, opzionalmente con `,asc` / `,desc`. Qualsiasi altro valore → 400.

### Preferiti — utente autenticato
| Metodo | Path | Status |
|---|---|---|
| GET | `/api/preferiti?page=` | 200 |
| POST | `/api/preferiti` `{autoId}` | 201 · 404 (auto non pubblicata) · 409 |
| DELETE | `/api/preferiti/{id}` | 204 · 404 |

### Avvisi di prezzo — utente autenticato
| Metodo | Path | Status |
|---|---|---|
| GET | `/api/avvisi?page=` | 200 |
| POST | `/api/avvisi` `{preferitoId, soglia}` | 201 · 404 · 409 |
| PUT | `/api/avvisi/{id}` `{soglia}` | 200 · 404 |
| DELETE | `/api/avvisi/{id}` | 204 · 404 |
| GET | `/api/avvisi/disattiva?token=` | **pubblico**, pagina HTML · 200 · 404 (token non valido o già usato) |

**Regola di invio:** mail + notifica quando il prezzo di un'auto pubblicata scende **sotto** la soglia.
Per la stessa soglia l'avviso parte una sola volta; se l'utente imposta una soglia **più bassa** di quella
già notificata e il prezzo ci scende sotto, l'avviso riparte.

### Notifiche — utente autenticato
| Metodo | Path | Status |
|---|---|---|
| GET | `/api/notifiche?nonLette=&page=` | 200 |
| GET | `/api/notifiche/conteggio` | 200 `{nonLette}` |
| PATCH | `/api/notifiche/{id}/letta` | 204 · 404 |
| PATCH | `/api/notifiche/lette` | 204 |

**Tempo reale (WebSocket STOMP):** connessione a `ws://localhost:8080/ws`, header
`Authorization: Bearer <token>` nel frame `CONNECT`, sottoscrizione a `/user/queue/notifiche`.

### Annunci — ADMIN (e SUPER_ADMIN)
| Metodo | Path | Status |
|---|---|---|
| GET | `/api/admin/autodev/listings?make=&model=&limit=&page=` | 200 (20 risultati per pagina di default, max 20; `page` da 1 a 100; 1 chiamata auto.dev per pagina) |
| GET | `/api/admin/autodev/listings/{listingId}` | 200 · 404 · 502 |
| POST | `/api/admin/auto/import` `{listingId}` | 201 (bozza) · 409 · 502 |
| GET | `/api/admin/auto?stato=&page=&size=&sort=` | 200 |
| GET | `/api/admin/auto/{id}` | 200 · 404 |
| PUT | `/api/admin/auto/{id}` `{km, prezzo, stato, descrizione}` | 200 · 400 |
| PATCH | `/api/admin/auto/{id}/prezzo` `{prezzo}` | 200 |
| PATCH | `/api/admin/auto/{id}/pubblica` | 200 · 400 (dati mancanti) |
| PATCH | `/api/admin/auto/{id}/bozza` | 200 |

### Utenti — SUPER_ADMIN
| Metodo | Path | Status |
|---|---|---|
| GET | `/api/superadmin/utenti?ruolo=&page=` | 200 |
| PATCH | `/api/superadmin/utenti/{id}/ruolo` `{ruolo}` | 200 · 400 (proprio ruolo) · 404 |

Un utente senza token riceve **401**; un utente autenticato senza il ruolo richiesto riceve **403**.

---

## Integrazione auto.dev

1. `GET /listings/{id}` (senza `select`: serve tutto l'albero JSON) → dati commerciali (`retailListing`),
   scheda tecnica (`vehicle`), carburante (`vehicle.fuel`) e VIN.
2. `GET /photos/{vin}` → galleria in alta risoluzione.
3. Le due chiamate asincrone hanno ciascuna il proprio `try/catch` e vengono unite in un unico oggetto.

**Da USA a Italia** (una sola volta, all'import): prezzo USD → EUR con tasso fisso
(`app.cambio.usd-eur`), miglia → km, carburante con dizionario fisso, descrizione del venditore
tradotta con MyMemory oppure, se assente, generata direttamente in italiano dalla scheda tecnica.
Il risultato è salvato nel DB come bozza e l'admin può correggerlo prima di pubblicare.

---

## Sicurezza (scelte principali)

- Input sempre tramite **DTO** validati: campi come `ruolo`, `userId`, `attivo` aggiunti al body vengono ignorati.
- Ruolo deciso dal server; nel **JWT** solo id utente e ruolo. Il ruolo viene riletto dal DB a ogni richiesta.
- **Password** solo come hash BCrypt; mai restituite né scritte nei log (nei log solo id, mai email).
- Preferiti, avvisi e notifiche cercati per **id + proprietario**: la risorsa di un altro utente risponde 404.
- Ricerca con **Criteria API** e parametri (jolly `%` `_` resi letterali); ordinamento da **elenco chiuso**.
- Template mail con solo `th:text`/`th:href` (escape automatico); link di disattivazione con **token casuale monouso**.
- CORS e WebSocket aperti solo all'origine del frontend; API key e password Gmail solo da variabili d'ambiente.

## Test

```bash
./mvnw test
```
Test unitari su generazione descrizione, template mail (incluso escape del nome) e whitelist di ordinamento.
