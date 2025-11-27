const StrapiFactory = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');

// Load .env manually since we are running a standalone script
try {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (!line || line.trim().startsWith('#')) return;
      
      // Simple parse: KEY=VALUE
      // Handle value optionally wrapped in quotes
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('.env loaded manually');
  } else {
    console.log('.env file not found at', envPath);
  }
} catch (e) {
  console.warn('Failed to load .env manually:', e.message);
}

const postitsData = [
  { TITOLO: "Come gestire lo stress?", TESTO: "Ultimamente fatico a staccare dal lavoro quando torno a casa. Avete dei consigli per separare meglio i due mondi?", STILE: "a" },
  { TITOLO: "Feedback negativo", TESTO: "Ho ricevuto un feedback che non condivido affatto, ma non so come dirlo al mio responsabile senza sembrare sulla difensiva.", STILE: "b" },
  { TITOLO: "Pausa pranzo solitaria", TESTO: "Spesso mangio da solo perché mi vergogno a chiedere ai colleghi di unirsi a me. Capita anche a voi?", STILE: "c" },
  { TITOLO: "Idee non ascoltate", TESTO: "Propongo spesso nuove soluzioni durante i meeting ma sembrano cadere nel vuoto. Come fate a farvi ascoltare?", STILE: "d" },
  { TITOLO: "Cambio ruolo", TESTO: "Mi hanno proposto un cambio di ruolo interno ma temo di non essere all'altezza delle nuove responsabilità.", STILE: "a" },
  { TITOLO: "Collega difficile", TESTO: "C'è un collega che risponde sempre in modo sgarbato. Come posso gestire la situazione senza creare conflitti aperti?", STILE: "b" },
  { TITOLO: "Smart working e isolamento", TESTO: "Mi sento un po' isolato lavorando sempre da casa. Voi come mantenete i rapporti sociali con il team da remoto?", STILE: "c" },
  { TITOLO: "Orari flessibili", TESTO: "Fatico a darmi dei limiti con gli orari flessibili. Finisco per lavorare molto più del dovuto. Strategie?", STILE: "d" },
  { TITOLO: "Richiesta aumento", TESTO: "Vorrei chiedere un adeguamento salariale ma non trovo mai il momento giusto o il coraggio per farlo.", STILE: "a" },
  { TITOLO: "Stallo nella formazione", TESTO: "Sento che non sto imparando nulla di nuovo da mesi. Dovrei chiedere esplicitamente dei corsi di formazione?", STILE: "b" },
  { TITOLO: "Errore commesso", TESTO: "Ho fatto un errore importante su un progetto e ho paura delle conseguenze. A voi è mai successo? Come avete risolto?", STILE: "c" },
  { TITOLO: "Nuovo arrivato", TESTO: "Sono appena arrivato in azienda e mi sento un pesce fuor d'acqua. Quanto tempo ci vuole mediamente per ambientarsi?", STILE: "d" },
  { TITOLO: "Riunioni infinite", TESTO: "Passiamo troppo tempo in riunione e poco a lavorare operativamente. Come si può proporre un cambiamento costruttivo?", STILE: "a" },
  { TITOLO: "Sindrome dell'impostore", TESTO: "Spesso penso che prima o poi scopriranno che non sono così bravo come credono. È una sensazione comune?", STILE: "b" },
  { TITOLO: "Conflitto di valori", TESTO: "L'azienda ha preso una direzione strategica che non condivido eticamente. Non so se parlarne o cercare altro.", STILE: "c" },
  { TITOLO: "Burnout vicino", TESTO: "Mi sento costantemente esausto e demotivato. Quali sono i primi segnali di burnout da non ignorare assolutamente?", STILE: "d" },
  { TITOLO: "Cercasi mentor", TESTO: "Sentirei il bisogno di un mentor per consigli sulla carriera. Voi ne avete uno? Come lo avete trovato?", STILE: "a" },
  { TITOLO: "Comunicazione interna", TESTO: "Le email interne sono spesso confuse e creano malintesi. Meglio insistire per parlarsi di persona o in call?", STILE: "b" },
  { TITOLO: "Successi non celebrati", TESTO: "Raggiungiamo spesso gli obiettivi ma nessuno dice mai 'bravo'. Manca un po' di riconoscimento e questo pesa.", STILE: "c" },
  { TITOLO: "Prospettive future", TESTO: "Non vedo grandi possibilità di crescita qui. Vale la pena restare solo per l'ambiente che è comunque buono?", STILE: "d" }
];

const getRandomStyle = () => {
  const styles = ['a', 'b', 'c', 'd'];
  return styles[Math.floor(Math.random() * styles.length)];
};

async function seed() {
  let strapi;
  try {
    // Inizializza Strapi puntando alla cartella dist compilata
    // Usa createStrapi se disponibile (v5), altrimenti fallback
    if (typeof StrapiFactory.createStrapi === 'function') {
      strapi = StrapiFactory.createStrapi({ distDir: './dist' });
    } else if (typeof StrapiFactory === 'function') {
      strapi = StrapiFactory({ distDir: './dist' });
    } else {
      throw new Error('Impossible to find Strapi factory');
    }
    
    await strapi.load();
    
    // Verifica se usare Document Service (Strapi 5) o Entity Service
    const useDocumentService = typeof strapi.documents === 'function';
    
    console.log(`Inizio creazione di ${postitsData.length} postit fittizi...`);
    console.log(`Modalità: ${useDocumentService ? 'Document Service (Strapi 5)' : 'Entity Service'}`);

    let createdCount = 0;

    for (const p of postitsData) {
      const data = {
        TITOLO: p.TITOLO,
        TESTO: p.TESTO,
        STILE: p.STILE || getRandomStyle(), // Fallback se manca stile
      };

      try {
        if (useDocumentService) {
          // Document Service API
          await strapi.documents('api::postit.postit').create({
            data: data,
            status: 'published'
          });
        } else {
          // Entity Service API
          await strapi.entityService.create('api::postit.postit', {
            data: {
              ...data,
              publishedAt: new Date(),
            }
          });
        }
        createdCount++;
        // Piccola barra di progresso visiva
        process.stdout.write('.');
      } catch (err) {
        console.error(`\nErrore creando "${p.TITOLO}":`, err.message);
      }
    }

    console.log(`\n\nOperazione completata! Creati ${createdCount} su ${postitsData.length} postit.`);
    
  } catch (error) {
    console.error('Errore generale nello script:', error);
  } finally {
    // Chiudi connessioni db se strapi è stato caricato
    if (strapi) {
        try {
            await strapi.destroy();
        } catch (e) { /* ignore */ }
    }
    process.exit(0);
  }
}

seed();
