# Frontend - Postit App

App Next.js per creare postit e aggiungere commenti, integrata con backend Strapi.

## Setup

1. Installa le dipendenze:
```bash
npm install
```

2. Assicurati che il backend Strapi sia in esecuzione su `http://localhost:1337`

3. Avvia il server di sviluppo:
```bash
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`

## Configurazione Backend

L'account "anonimo" viene creato automaticamente dal backend Strapi all'avvio. Se necessario, puoi crearlo manualmente:

1. Accedi al pannello admin di Strapi (`http://localhost:1337/admin`)
2. Vai su **Settings** → **Users & Permissions Plugin** → **Users**
3. Crea un nuovo utente con:
   - Username: `anonimo`
   - Email: `anonimo@example.com`
   - Password: `anonimo`

4. Assicurati che il ruolo "Authenticated" abbia i permessi per:
   - Creare POSTIT
   - Creare Commenti

5. Assicurati che il ruolo "Public" abbia i permessi per:
   - Leggere POSTIT pubblicati
   - Leggere commenti approvati

## Funzionalità

- Click sulla pagina bianca per creare un nuovo postit
- Click su un postit per visualizzare e aggiungere commenti
- Autenticazione automatica con account "anonimo"

