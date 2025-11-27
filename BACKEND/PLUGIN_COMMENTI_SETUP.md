# Configurazione Plugin Commenti Strapi

## Installazione Completata ✅

Il plugin `strapi-plugin-comments` è stato installato e integrato nel progetto Strapi.

## Configurazione Manuale Necessaria

Dopo aver avviato Strapi per la prima volta (`npm run develop`), è necessario configurare le autorizzazioni per il plugin commenti nel pannello di amministrazione.

### Passaggi per la Configurazione delle Autorizzazioni

1. **Avvia Strapi in modalità sviluppo:**
   ```bash
   npm run develop
   ```

2. **Accedi al pannello di amministrazione:**
   - Apri il browser e vai all'URL indicato nel terminale (solitamente `http://localhost:1337/admin`)
   - Completa la registrazione del primo utente admin se è la prima volta

3. **Configura le autorizzazioni per il ruolo Public:**
   - Vai su **Settings** → **Users & Permissions Plugin** → **Roles** → **Public**
   - Nella sezione **Permissions**, cerca la sezione **Comments Plugin**
   - Abilita le seguenti autorizzazioni:
     - `count` - Conteggio commenti
     - `find` - Visualizzazione commenti
     - `getPageSize` - Dimensione pagina commenti

4. **Configura le autorizzazioni per il ruolo Authenticated:**
   - Vai su **Settings** → **Users & Permissions Plugin** → **Roles** → **Authenticated**
   - Nella sezione **Permissions**, cerca la sezione **Comments Plugin**
   - Abilita le seguenti autorizzazioni:
     - `create` per **Comment** - Creazione commenti
     - `create` per **Subcomment** - Creazione risposte ai commenti
     - `find` - Visualizzazione commenti
     - `count` - Conteggio commenti

5. **Configurazione del Plugin (opzionale):**
   - Vai su **Settings** → **Comments Plugin** → **Configuration**
   - Configura le impostazioni secondo le tue esigenze:
     - Abilita le collezioni su cui permettere i commenti
     - Configura la moderazione dei commenti
     - Imposta altre opzioni disponibili

## Verifica

Dopo aver configurato le autorizzazioni, il plugin commenti sarà disponibile e funzionante. Potrai:

- Visualizzare i commenti nelle collezioni abilitate
- Gli utenti autenticati potranno creare commenti e risposte
- Gli utenti pubblici potranno visualizzare i commenti (se autorizzati)

## Note

- Il plugin aggiunge automaticamente le entità `Comment` e `Subcomment` al sistema
- Puoi abilitare i commenti su qualsiasi collezione di contenuti nel pannello admin
- Ricorda di pubblicare le modifiche alle autorizzazioni dopo averle configurate

## Riferimenti

- [Documentazione Plugin Commenti](https://github.com/VirtusLab-Open-Source/strapi-plugin-comments)
- [Documentazione Strapi Permissions](https://docs.strapi.io/dev-docs/plugins/users-permissions)

