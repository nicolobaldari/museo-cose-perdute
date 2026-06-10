# Il Museo delle Cose Perdute - Documentazione di Progetto

## 1. Introduzione e Obiettivi del Progetto
Il Museo delle Cose Perdute è una piattaforma web pensata per la gestione e il ritrovamento di oggetti smarriti e ritrovati all'interno di un ambiente "chiuso", come un campus universitario come l'ELIS. L'applicazione introduce dinamiche di interazione protetta e flussi di approvazione vincolati, garantendo la sicurezza e la privacy degli utenti nelle fasi di rivendicazione e restituzione dei beni.

Il progetto è stato sviluppato coprendo integralmente i requisiti funzionali previsti dai Livelli 1 e 2, con l'aggiunta di estensioni avanzate tipiche del Livello 3, come un algoritmo di matching automatico predittivo e un sistema di messaggistica interna a mo' di bacheca.

---

## 2. Architettura del Sistema
L'applicazione adotta un'architettura di tipo client-server basata su una netta separazione tra backend e frontend:

* **Backend (Node.js & Express):** Gestisce la logica di business, l'interazione con il database relazionale, l'autenticazione delle sessioni e l'esposizione di API RESTful destinate al frontend.
* **Database (MySQL & Sequelize ORM):** L'utilizzo di Sequelize permette una mappatura a oggetti (ORM) delle entità del database, garantendo l'integrità referenziale tramite vincoli nativi (Foreign Keys) e validazioni strutturali direttamente sui modelli.
* **Frontend (HTML5, Vanilla JavaScript, Tailwind CSS):** L'interfaccia utente è sviluppata come un'applicazione dinamica che comunica con il backend esclusivamente tramite richieste asincrone HTTP (Fetch API). La gestione dello stato visivo e l'aggiornamento del DOM avvengono lato client senza la necessità di framework complessi, mantenendo l'applicazione leggera e reattiva.

---

## 3. Modello dei Dati e Relazioni
Il database è composto da quattro entità principali definite all'interno della directory `models/`:

1.  **Utente (`utenti`):** Archivia i dati anagrafici e le credenziali di accesso. Il campo `email` è protetto da un vincolo di unicità e validato strutturalmente.
2.  **Segnalazione (`segnalazioni`):** Modello centrale che rappresenta sia gli oggetti smarriti che quelli ritrovati tramite un campo di tipo `ENUM('smarrito', 'ritrovato')`. Include la gestione del ciclo di vita dell'annuncio tramite lo stato (`aperta`, `in_verifica`, `risolta`, `archiviata`) e la `domanda_verifica` per i depositi.
3.  **Match (`match_proposte`):** Entità relazionale di congiunzione che associa una segnalazione di smarrimento a una di ritrovamento. Tiene traccia dell'utente proponente, della risposta fornita alla domanda segreta e dello stato della richiesta (`in_attesa`, `approvato`, `rifiutato`).
4.  **Messaggio (`messaggi`):** Gestisce la comunicazione scritta memorizzando il contenuto, lo stato di lettura e i riferimenti a mittente, destinatario e segnalazione di contesto.

### Associazioni e Integrità Referenziale
Come configurato nell'entry-point dei modelli:
* Un Utente può creare più Segnalazioni (`hasMany`); in caso di cancellazione dell'utente, le sue segnalazioni vengono rimosse a cascata (`CASCADE`).
* I Messaggi implementano una doppia associazione verso l'Utente (come `Mittente` e `Destinatario`) e appartengono a una specifica Segnalazione.
* Il modello Match si collega a due istanze distinte della tabella Segnalazione (con alias `SegnalazioneSmarrita` e `SegnalazioneRitrovata`), garantendo la tracciabilità delle coppie di oggetti collegate.

---

## 4. Logica di Business e Flussi Applicativi

### Autenticazione e Sicurezza
L'accesso alle risorse protette è regolato da un meccanismo di autenticazione basato su **JSON Web Token (JWT)**.
1.  In fase di registrazione, la password viene cifrata tramite l'algoritmo di hashing `bcrypt` con un fattore di costo pari a 10 prima del salvataggio nel database.
2.  Al login, il server valida le credenziali e rilascia un token firmato con validità di 2 ore, contenente l'identificativo dell'utente, l'email e il nome.
3.  Il client memorizza il token nel `localStorage` e lo trasmette nell'header HTTP (`Authorization: Bearer <token>`) per ogni richiesta successiva verso le rotte protette. Un middleware dedicato lato backend intercetta il token, ne verifica l'integrità e inietta i dati dell'utente nell'oggetto `req.user` per i controller successivi.

### Il Ciclo di Vita del Matching e della Verifica
Il flusso operativo per la restituzione di un oggetto evita scambi non autorizzati attraverso i seguenti passaggi logici:
1.  **Creazione:** Un utente pubblica un oggetto ritrovato e inserisce una `domanda_verifica` (es: "Qual è il soggetto dell'adesivo sul retro?"). Questo dettaglio non viene mostrato pubblicamente nella descrizione.
2.  **Proposta di Match:** Un utente che ha smarrito un oggetto compatibile consulta il dettaglio dell'oggetto ritrovato, seleziona la propria segnalazione di smarrimento e inserisce la risposta scritta alla domanda di sicurezza. L'invio della proposta muta automaticamente lo stato di entrambi gli annunci da `aperta` a `in_verifica`, impedendo ad altri utenti di interagire con quegli stessi oggetti durante la fase di controllo.
3.  **Risoluzione del Match:** Il ritrovatore visualizza la proposta nella propria area riservata o nella pagina di dettaglio.
    * Se la risposta è corretta e il match viene **approvato**, lo stato delle due segnalazioni passa a `risolta` e il match diventa `approvato`.
    * Se la risposta è errata e il match viene **rifiutato**, lo stato degli annunci torna a essere `aperta`, rendendo gli oggetti nuovamente disponibili in bacheca per altre verifiche.

### Algoritmo di Suggerimento Predittivo
Per semplificare la ricerca, il sistema implementa un endpoint di matching automatico operante lato server. Quando un utente visualizza una propria segnalazione di smarrimento, il backend esegue una query ottimizzata per individuare gli oggetti con stato `aperta`, di tipo `ritrovato`, appartenenti alla medesima categoria merceologica e inseriti da utenti terzi. I risultati vengono proposti direttamente all'utente permettendogli di avviare il reclamo con un click.

### Chat Contestuale di Restituzione
Per adempiere ai requisiti di usabilità senza introdurre la complessità dei protocolli WebSocket, la comunicazione bilaterale è affidata a una soluzione REST-driven basata sull'interazione utente.
Una volta che una coppia di oggetti è associata a un match in stato `approvato`, si sblocca un canale di messaggistica dedicato visibile esclusivamente ai due utenti coinvolti. La rotta backend controlla l'identità del richiedente verificando che coincida con il creatore dell'annuncio o con il proponente del match. I messaggi vengono visualizzati in una bolla asincrona all'interno della pagina di dettaglio dell'oggetto, e l'aggiornamento è delegato a un pulsante di ricarica manuale controllato che interroga l'endpoint senza dover rieseguire il rendering dell'intera pagina web.

---

## 5. Documentazione delle API (Endpoint)

### Autenticazione (`/api/auth`)
* `POST /register`: Riceve `nome`, `email`, `password`. Verifica l'unicità dell'email, esegue l'hashing della password e crea l'utente.
* `POST /login`: Riceve `email`, `password`. Verifica le credenziali e restituisce un JSON contenente il token JWT.

### Segnalazioni (`/api/segnalazioni`)
* `POST /` *(Prototta)*: Riceve i dati dell'annuncio. Gestisce condizionalmente il campo `domanda_verifica` azzerandolo se l'oggetto è smarrito.
* `GET /`: Restituisce l'elenco pubblico delle segnalazioni ordinate in modo decrescente per data di inserimento. Accetta query parameters opzionali (`tipo`, `categoria`, `luogo`) per filtrare i risultati.
* `GET /utente/mie` *(Protetta)*: Restituisce esclusivamente gli annunci creati dall'utente autenticato.
* `GET /:id` *(Protetta)*: Restituisce l'oggetto comprensivo di flag booleani calcolati sul momento, indicando se l'annuncio appartiene all'utente loggato (`isMio`) e se è già stata sottomessa una proposta di match (`haRichiestoMatch`).
* `DELETE /:id` *(Protetta)*: Consente la rimozione definitiva di un annuncio previa verifica della proprietà dello stesso.

### Proposte di Match (`/api/match`)
* `POST /:id_segnalazione_ritrovato` *(Protetta)*: Riceve l'ID dell'oggetto smarrito e la risposta scritta. Modifica gli stati degli oggetti coinvolti e archivia la proposta.
* `PATCH /:id/stato` *(Protetta)*: Permette al proprietario del ritrovamento di inviare il `nuovoStato` (`approvato` o `rifiutato`), aggiornando coerentemente le tabelle collegate.
* `GET /ricevute/:id_segnalazione` *(Protetta)*: Elenca le proposte ricevute per un determinato oggetto ritrovato.
* `GET /suggerimenti/:id_segnalazione` *(Protetta)*: Esegue l'algoritmo di incrocio automatico per mostrare oggetti trovati affini alla segnalazione passata.

### Messaggi e Chat (`/api/messaggi`)
* `POST /:id_segnalazione` *(Protetta)*: Permette l'invio di un messaggio standard di contatto all'autore di una segnalazione aperta.
* `GET /ricevuti/:id_segnalazione` *(Protetta)*: Recupera i messaggi unidirezionali ricevuti per una data segnalazione.
* `GET /chat/:id_segnalazione` *(Protetta)*: Recupera lo storico della chat bilaterale per un match confermato.
* `POST /chat/:id_segnalazione` *(Protetta)*: Inserisce un messaggio all'interno della chat del match, calcolando dinamicamente il destinatario corretto tra i due partecipanti.

---

## 6. Configurazione e Avvio Localizzato

### Installazione delle Dipendenze
All'interno della radice del progetto, installare i pacchetti specificati nel `package.json` digitando:
```bash
npm install