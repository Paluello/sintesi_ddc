# 🎈 Bacheca Digitale - Guida Super Semplice

Ciao! 👋 Se sei qui per far partire il progetto e non hai mai usato un terminale, sei nel posto giusto. Non preoccuparti, è come accendere due interruttori.

Il progetto è diviso in due parti che devono funzionare insieme:
1. **BACKEND** (Il cervello 🧠): Gestisce i dati.
2. **FRONTEND** (La faccia 🎨): È il sito che vedi e clicchi.

---

## 🚨 DA FARE SOLO LA PRIMA VOLTA (Installazione)
Se hai appena scaricato la cartella e non l'hai mai accesa, devi installare i "pezzi" mancanti. Se lo hai già fatto in passato, salta direttamente alla sezione "COME ACCENDERE TUTTO".

1. Apri il terminale nella cartella principale del progetto.
2. Scrivi questo comando e premi **INVIO** sulla tastiera:
   ```bash
   cd BACKEND
   ```
3. Scrivi questo e premi **INVIO** (ci metterà un po', vedrai scorrere tante scritte, aspetta che finisca):
   ```bash
   npm install
   ```
4. Ora torna indietro. Scrivi questo e premi **INVIO**:
   ```bash
   cd ..
   ```
5. Entra nell'altra cartella. Scrivi questo e premi **INVIO**:
   ```bash
   cd FRONTEND
   ```
6. Installa anche qui. Scrivi questo e premi **INVIO** (anche qui, aspetta che finisca):
   ```bash
   npm install
   ```

---

## 🚀 COME ACCENDERE TUTTO (Ogni volta)

Ti serviranno **DUE** finestre del terminale aperte contemporaneamente.

### PASSO 1: Accendi il Cervello (Backend) 🧠

1. Apri il terminale nella cartella del progetto.
2. Entra nella cartella del backend scrivendo questo e premendo **INVIO**:
   ```bash
   cd BACKEND
   ```
3. Accendilo scrivendo questo e premendo **INVIO**:
   ```bash
   npm run develop
   ```
4. **ASPETTA** qualche secondo. Quando vedi delle scritte verdi e un link, vuol dire che è acceso.
5. **NON CHIUDERE QUESTA FINESTRA!** Se la chiudi, spegni il cervello del sito.

### PASSO 2: Accendi la Faccia (Frontend) 🎨

1. Apri una **NUOVA** finestra del terminale (lascia aperta quella di prima!).
2. Assicurati di essere nella cartella del progetto, poi entra nel frontend scrivendo questo e premendo **INVIO**:
   ```bash
   cd FRONTEND
   ```
3. Accendilo scrivendo questo e premendo **INVIO**:
   ```bash
   npm run dev
   ```
4. Aspetta che compaia la scritta `Ready in ...`.

### 🏁 Fatto!
Ora apri il tuo browser (Chrome, Safari, Firefox) e vai a questo indirizzo:
👉 **http://localhost:3000**

---

### ❌ Come spegnere tutto
Quando hai finito, vai sulle finestre del terminale e premi `CTRL + C` sulla tastiera per fermare tutto, poi puoi chiudere le finestre.
