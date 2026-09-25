# Progettazione — Mini Salone Auto

Documento di progettazione del progetto (settimana 3, unità 5), trascritto dal PDF originale
*Progettazione S3U5*. Il testo è riportato fedelmente; le uniche differenze sono:

- la **API key di auto.dev** è stata sostituita con un segnaposto: è un segreto e vive solo nella
  variabile d'ambiente `AUTODEV_API_KEY`, mai nella repository;
- alcune righe delle *application properties*, rovinate dalla conversione in PDF, sono ricostruite
  com'erano in origine (e come sono in `BE/src/main/resources/application.properties`).

Le scelte fatte durante lo sviluppo rispetto a questo documento sono in fondo, in
[Note di realizzazione](#note-di-realizzazione).

---

Leggi lo stack tecnologico e le cartelle già impostate, aggiungi successivamente dipendenze nel pom se necessario.

Devo fare una webapp, sia la parte FE che la parte BE, per realizzare un mini salone di automobili.
Il FE è fatto in React, il BE con Java.

## Entità

### User

- ID (uuid)
- nome
- cognome
- email (unique)
- password
- created_at

### Preferiti (tabella middle per il many to many tra auto e User)

- Id (uuid)
- user_id (FK)
- autod_id (FK)
- created_at

### Auto

- ID (uuid)
- Immagini dell'auto (prese da API gratuito)
- Scheda tecnica (API auto.dev)
- Kilometraggio (integer max 6 cifre)
- Prezzo (decimal 9, 2)
- Stato (enum nuovo, km 0, usato)

---

## Application properties

```properties
spring.application.name=BE

# --- Database (Postgres) ---
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/db-PS3U5}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:1234}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
spring.jpa.show-sql=false

# --- Email (Gmail SMTP) ---
spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=3000
spring.mail.properties.mail.smtp.writetimeout=5000

app.mail.mittente=${MAIL_FROM:alberto.razzolini@gmail.com}

# --- JWT ---
# Secret lasciato in chiaro come default volutamente: progetto didattico,
# cosi' chi clona il repo (es. per la correzione) puo' avviarlo senza dover
# configurare variabili d'ambiente. In un progetto reale andrebbe SOLO in
# una variabile d'ambiente, mai committato.
app.jwt.secret=${JWT_SECRET:UflahZjoJuYfrd3Tl6OEGGyiIophMJIbRe1tbuDty7B830VwfU}

# 1 settimana, comoda per la correzione senza dover rifare il login
app.jwt.expiration=${JWT_EXPIRATION:604800000}

# --- CORS (frontend Vite/React) ---
app.cors.allowed-origin=${ALLOWED_ORIGIN:http://localhost:5173}

logging.level.it.epicode=INFO
```

---

## Features da supportare

- **Registrazione:**
  - Nome
  - Cognome
  - Email
  - Password
- **Login:**
  - Email
  - Password
- **Ricerca delle auto pubblicate**, paginazione con 10 elementi (anche utente non registrato).
- **Aggiunta delle auto listate ai preferiti** (utente registrato).
- **Soglia di prezzo:** fissare una soglia di prezzo per essere notificato tramite email se il prezzo
  dell'auto messa tra i preferiti scende sotto quella determinata soglia. Se però risetta la soglia con un
  prezzo minore del precedente ed il prezzo effettivo del veicolo scende nuovamente sotto la nuova soglia,
  rimandare la mail (utente registrato).
- Ci saranno **tre tipi di account**, un user base, un admin ed un super-admin:
  - **Super-Admin:** può cambiare il ruolo agli utenti, ha anche tutti i poteri degli altri ruoli.
  - **Admin:** può creare e modificare un nuovo annuncio. All'interno dell'annuncio, può settare un prezzo,
    modificare il prezzo, salvare l'annuncio come bozza o pubblicarlo.
  - **User:** può cercare auto (paginazione con 10 elementi ciascuno) nella pagina vetrina, può ricercare
    per input (barra di ricerca con suggerimento a tendina dopo 3 lettere), aggiungere auto selezionata ai
    preferiti, settare un prezzo di soglia sotto il quale viene avvertito con notifica e mail all'indirizzo
    mail registrato.

    Nell'annuncio, ci devono essere queste informazioni:
    - Immagini dell'auto (prese da API gratuito auto.dev)
    - Scheda tecnica (API auto.dev)
    - Kilometraggio (integer max 6 cifre)
    - Prezzo (decimal 9, 2)
    - Stato (enum nuovo, km 0, usato)

---

## Integrazione con auto.dev

Per quanto riguarda gli API da cui prendere i dati: sto integrando le API di auto.dev e ho bisogno di scrivere
una funzione che, partendo dall'ID univoco di un annuncio (Listing ID), recuperi tutti i dati completi della
vettura: scheda tecnica (incluso il tipo di carburante utilizzato), prezzo, descrizione del venditore e
galleria fotografica completa.

Ecco le regole architetturali delle API di auto.dev che devi rispettare tassativamente per costruire la logica:

1. **FLUSSO DI BASE (2 chiamate separate):**
   Le immagini e i dati dell'annuncio sono su due endpoint diversi. L'unico modo per avere le immagini
   partendo da un ID annuncio è fare prima la chiamata per i dati, estrarre il VIN (numero di telaio) e
   usarlo per chiamare l'endpoint delle foto.

2. **PRIMA CHIAMATA (Dati commerciali e Scheda Tecnica):**
   - Endpoint: `GET /listings/{id}` (dove `{id}` è il mio input).
   - NON utilizzare il parametro di query `select`. Ho bisogno dell'intero albero JSON di risposta per avere
     la scheda tecnica completa.
   - Da questo JSON dovrò estrarre:
     - Il prezzo e la descrizione commerciale dell'annuncio (che si trovano nell'oggetto `retailListing`).
     - La scheda tecnica completa e gli optional (che si trovano nell'oggetto `vehicle`).
     - Il tipo di carburante (che si trova in `vehicle.fuelType`).
     - Il numero di telaio (che si trova in `vehicle.vin`), fondamentale per il passaggio successivo.

3. **SECONDA CHIAMATA (Galleria Immagini):**
   - Endpoint: `GET /photos/{vin}` (usando il VIN appena estratto dalla prima chiamata).
   - Questa chiamata restituisce gli URL in alta risoluzione della vettura.

4. **FUNZIONE DI RICERCA GENERICA (Fase di test):**
   Oltre alla funzione per il singolo ID, scrivimi anche una seconda funzione per cercare una lista di auto
   (usando l'endpoint base `GET /listings` con filtri opzionali come `make` e `model`).
   Siccome sono in fase di test e non voglio consumare troppi crediti API, in questa funzione imposta sempre
   di default il parametro di query `limit=1`, in modo da scaricare un solo veicolo alla volta durante le prove.

La mia API key (da salvare in variabile d'ambiente) è `<AUTODEV_API_KEY>`.

**Query String**

```bash
curl "https://api.auto.dev/vin/WP0AF2A99KS165242?apiKey=<AUTODEV_API_KEY>"
```

**Authorization Header**

```bash
curl -X GET "https://api.auto.dev/vin/WP0AF2A99KS165242" \
  -H "Authorization: Bearer <AUTODEV_API_KEY>" \
  -H "Content-Type: application/json"
```

Scrivimi il codice per implementare questa logica (usa un blocco try/catch per gestire gli errori delle due
chiamate asincrone) e mostrami come mappare e unire i dati estratti dalle due risposte in un unico oggetto
finale ben formattato.

---

## Nota sulla sicurezza

**Da difendere: tutto quello che arriva dal client, compreso il nome dell'utente.** Ricerca e ordinamento del
catalogo non concatenano niente. Il campo su cui ordinare arriva dal client e non si può legare come
parametro: si confronta con un elenco chiuso di valori ammessi. (Se fatta ricerca) La descrizione dell'auto
finisce nella pagina, il nome dell'utente finisce nella mail. Tutti e due sono testo: niente
`dangerouslySetInnerHTML`, e il template HTML della mail fa l'escape di ogni valore. Registrazione, profilo e
avvisi ricevono un DTO, mai l'entità. Chi aggiunge ruolo, inviato o utenteId al corpo della richiesta non deve
riuscire a cambiare niente.

**Da difendere: ogni indirizzo risponde solo a chi ne ha diritto.** Cambiare il prezzo spetta
all'amministratore: un utente collegato che ci prova riceve 403. Il ruolo lo decide il server alla
registrazione, e nel JWT ci sono solo i dati che servono. Avvisi e preferiti si cercano per identificativo e
per proprietario insieme. Chi cambia `/api/avvisi/12` in `/api/avvisi/13` riceve 404: non deve nemmeno sapere
che l'avviso di un altro esiste. Il link della mail per disattivare l'avviso porta un token casuale e
monouso, non l'id. Nei log non finiscono password né indirizzi email, e la password di Gmail non entra nella
repository.

Troverai che i prezzi sono in dollari e le descrizioni sono in inglese, trasformali in euro e traduci in
Italiano.

Se c'è bisogno di qualche dettaglio in più che non è chiaro o hai qualche consiglio, fermati e chiedi.

---

## Note di realizzazione

Scelte fatte durante lo sviluppo rispetto al documento, con il motivo. I dettagli sono nei README di
[`BE/`](../BE/README.md) e [`FE/`](../FE/README.md).

| Punto del documento | Come è stato realizzato |
|---|---|
| `autod_id` nella tabella Preferiti | Refuso: la colonna è `auto_id` |
| `logging.level.it.epicode` | Il package del progetto è `com.example.be`, quindi `logging.level.com.example.be` |
| Carburante in `vehicle.fuelType` | Nelle risposte reali di auto.dev il campo è `vehicle.fuel`: si legge `fuel` e, se manca, `fuelType` |
| Ricerca generica con `limit=1` di default | Rispettato durante lo sviluppo. Chiusa la fase di test il default è 20 (massimo del piano Free), configurabile con `AUTODEV_LIMIT_DEFAULT`; impostandola a `1` si torna al comportamento di test |
| L'admin "crea" un annuncio | Gli annunci si creano importandoli da auto.dev come bozza (immagini e scheda tecnica devono venire da lì); l'admin poi imposta prezzo, km, stato e descrizione e pubblica |
| Modifica del prezzo | Endpoint dedicato `PATCH /api/admin/auto/{id}/prezzo`, unico punto che ricontrolla gli avvisi; km, stato e descrizione si modificano a parte |
| Soglia di prezzo | Deve essere inferiore al prezzo attuale: l'avviso segnala un ribasso, quindi non parte mai al momento della creazione |
| Dollari → euro, inglese → italiano | Tasso di cambio fisso; carburante e valori della scheda tecnica con dizionari fissi; descrizione del venditore tradotta con MyMemory o, se assente, generata direttamente in italiano |
| Paginazione con 10 elementi | In vetrina: 1 auto in evidenza + griglia 3×3 per pagina |
