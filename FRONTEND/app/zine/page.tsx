'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Toolbar from '@/components/molecules/Toolbar/Toolbar';
import SideMenu from '@/components/organisms/SideMenu/SideMenu';
import ZineCard from '@/components/organisms/ZineCard/ZineCard';
import { getZines } from '@/lib/api';
import { Zine } from '@/types/zine';
import styles from './page.module.css';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export default function ZinePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [zines, setZines] = useState<Zine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titleSvgContent, setTitleSvgContent] = useState<string | null>(null);

  const handleToolbarMenuClick = () => {
    setMenuOpen(prev => !prev);
  };

  // Carica l'SVG del titolo
  useEffect(() => {
    const loadTitleSvg = async () => {
      try {
        const response = await fetch('/svg_artefatti/zine/questioni di ascolto.svg');
        if (response.ok) {
          const svgText = await response.text();
          setTitleSvgContent(svgText);
        }
      } catch (error) {
        console.error('Errore nel caricamento SVG titolo:', error);
      }
    };

    loadTitleSvg();
  }, []);

  useEffect(() => {
    const fetchZines = async () => {
      try {
        setLoading(true);
        const fetchedZines = await getZines();
        // Prendi solo le prime 3 zine
        setZines(fetchedZines.slice(0, 3));
        setError(null);
      } catch (err: any) {
        console.error('Errore nel caricamento delle zine:', err);
        setError('Errore nel caricamento delle fanzine');
      } finally {
        setLoading(false);
      }
    };

    fetchZines();
  }, []);

  // Funzione per ottenere URL file
  const getFileUrl = (zine: Zine) => {
    if (!zine.FILE?.url) return null;
    return zine.FILE.url.startsWith('http') 
      ? zine.FILE.url 
      : `${STRAPI_URL}${zine.FILE.url}`;
  };

  return (
    <div className={styles.container}>
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <Toolbar
        onMenuClick={handleToolbarMenuClick}
        showOnlyMenu={true}
        isMenuOpen={menuOpen}
      />
      
      <div className={styles.content}>
        {/* SEZIONE INTRODUTTIVA */}
        <section className={styles.introSection}>
          <div className={styles.introContent}>
            {titleSvgContent && (
              <div 
                className={styles.mainTitle}
                dangerouslySetInnerHTML={{ __html: titleSvgContent }}
              />
            )}
            <p className={styles.introParagraph}>
              L'inclusione sul lavoro non si costruisce con policy imposte dall'alto, ma attraverso gesti quotidiani e relazioni autentiche. Per questo la campagna ha scelto di parlarne attraverso un formato che si ispira alle zine: pubblicazioni indipendenti nate per circolare liberamente, passando di mano in mano.
            </p>
            <p className={styles.introParagraph}>
              Questioni di ascolto è una serie di tre numeri che esplora il tema dell'ascolto come pratica fondamentale per creare ambienti di lavoro inclusivi. Ogni numero approfondisce un elemento diverso, io, l'altrə e gli spazi, costruendo gradualmente una mappa di strumenti concreti che chiunque può utilizzare nella propria quotidianità lavorativa.
            </p>
          </div>
        </section>

        <section className={styles.introSection}>
          <div className={styles.introContent}>
            <h2 className={styles.sectionTitle}>IL FORMATO: ACCESSIBILE E PORTATILE</h2>
            <p className={styles.introParagraph}>
              Le zine sono state progettate come fogli pieghevoli che si trasformano in piccoli libretti tascabili. Un singolo foglio A2, ripiegato su se stesso, crea una sequenza di aperture progressive: ogni volta che si sfoglia, si accede a una nuova sezione mentre il retro presenta uno dei manifesti chiave della campagna. Questo doppio uso trasforma ogni copia in uno strumento versatile: da un lato un supporto di riflessione personale, dall'altro un poster. Il formato pieghevole accompagna la lettura con un ritmo preciso, invitando a procedere con calma, a soffermarsi.
            </p>
          </div>
        </section>

        <section className={styles.introSection}>
          <div className={styles.introContent}>
            <h2 className={styles.sectionTitle}>UNO STRUMENTO CHE CIRCOLA</h2>
            <p className={styles.introParagraph}>
              La campagna fornisce le zine, ma lo spirito è quello della circolazione autonoma. Possono essere scaricate dal sito e stampate. Non c'è bisogno di permessi: se si pensa che qualcunə possa trovarle utili, le si condivide. Le zine sono pensate come oggetti che vivono negli spazi di lavoro: il loro valore si moltiplica quando escono dalle mani di chi le riceve e iniziano a circolare in modo autonomo, generando conversazioni e creando occasioni di confronto.
            </p>
            <p className={styles.introParagraph}>
              Non sono semplici materiali informativi da leggere e archiviare, ma inviti all'azione. Ogni copia è un'opportunità per iniziare a cambiare il modo in cui ci si relaziona con le persone che circondano. E proprio perché l'inclusione deve partire dal basso, dalle relazioni quotidiane, questi strumenti hanno bisogno di diffondersi liberamente, senza filtri.
            </p>
          </div>
        </section>

        {loading && (
          <div className={styles.loading}>
            Caricamento fanzine...
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {!loading && !error && zines.length === 0 && (
          <div className={styles.empty}>
            Nessuna fanzine disponibile
          </div>
        )}

        {/* SEZIONE 1: Tutte le descrizioni delle zine */}
        {!loading && !error && zines.length > 0 && (
          <div className={styles.descriptionsSection}>
            {zines.map((zine, index) => {
              const bgColor = index % 2 === 0 ? 'white' : 'black';
              return (
                <section 
                  key={zine.id} 
                  className={`${styles.descriptionCard} ${styles[bgColor]}`}
                >
                  <div className={styles.descriptionContent}>
                    <div className={styles.zineNumber}>
                      Zine #{index + 1}
                    </div>
                    {zine.DESCRIZIONE && (
                      <div className={styles.descriptionText}>
                        <ReactMarkdown>{zine.DESCRIZIONE}</ReactMarkdown>
                      </div>
                    )}
                    {/* Pulsante Download nella sezione descrizione */}
                    {getFileUrl(zine) && (
                      <div className={styles.downloadContainer}>
                        <a 
                          href={getFileUrl(zine)!} 
                          download={zine.FILE?.name || 'download'}
                          className={styles.downloadButton}
                        >
                          Scarica
                        </a>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* SEZIONE 2: Immagini (PNG, SVG) per ogni zine */}
        {!loading && !error && zines.map((zine, index) => {
          // Continua l'alternanza da dove si sono fermate le descrizioni
          // Le descrizioni occupano zines.length posizioni (0, 1, 2...)
          // Le immagini partono da zines.length (3, 4, 5...)
          const globalIndex = zines.length + index;
          const isLeft = globalIndex % 2 === 0;
          const bgColor = globalIndex % 2 === 0 ? 'white' : 'black';
          
          return (
            <ZineCard
              key={zine.id}
              zine={zine}
              isLeft={isLeft}
              bgColor={bgColor}
              hideDescription={true}
              hideDownload={true}
            />
          );
        })}
      </div>
    </div>
  );
}
