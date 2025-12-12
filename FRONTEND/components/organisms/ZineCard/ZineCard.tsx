'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Zine } from '@/types/zine';
import { extractColorFromSVG } from '@/lib/svgColorUtils';
import DownloadButton from '@/components/atoms/DownloadButton/DownloadButton';
import styles from './ZineCard.module.css';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface ZineCardProps {
  zine: Zine;
  isLeft: boolean;
  bgColor: 'white' | 'black';
  hideDescription?: boolean;
  hideDownload?: boolean;
}

export default function ZineCard({ zine, isLeft, bgColor, hideDescription = false, hideDownload = false }: ZineCardProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loadingSvg, setLoadingSvg] = useState(true);
  const [svgColor, setSvgColor] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carica il contenuto SVG
  useEffect(() => {
    if (!zine.SVG?.url) {
      setLoadingSvg(false);
      return;
    }

    const loadSvg = async () => {
      try {
        const svgUrl = zine.SVG.url.startsWith('http') 
          ? zine.SVG.url 
          : `${STRAPI_URL}${zine.SVG.url}`;
        
        const response = await fetch(svgUrl);
        if (response.ok) {
          const svgText = await response.text();
          setSvgContent(svgText);
          // Estrai il colore dall'SVG
          const extractedColor = extractColorFromSVG(svgText);
          if (extractedColor) {
            setSvgColor(extractedColor);
          }
        } else {
          console.error('Errore nel caricamento SVG:', response.statusText);
        }
      } catch (error) {
        console.error('Errore nel caricamento SVG:', error);
      } finally {
        setLoadingSvg(false);
      }
    };

    loadSvg();
  }, [zine.SVG]);

  const imageUrl = zine.IMMAGINE?.url 
    ? (zine.IMMAGINE.url.startsWith('http') 
        ? zine.IMMAGINE.url 
        : `${STRAPI_URL}${zine.IMMAGINE.url}`)
    : null;

  const fileUrl = zine.FILE?.url
    ? (zine.FILE.url.startsWith('http')
        ? zine.FILE.url
        : `${STRAPI_URL}${zine.FILE.url}`)
    : null;

  const fileName = zine.FILE?.name || zine.FILE?.alternativeText || 'download';

  return (
    <section className={`${styles.zineSection} ${isLeft ? styles.leftLayout : styles.rightLayout} ${styles[bgColor]}`}>
      <div className={styles.sectionContent}>
        {/* Immagine PNG sovrapposta */}
        {imageUrl && (
          <div className={`${styles.imageContainer} ${isLeft ? styles.imageLeft : styles.imageRight}`}>
            <img 
              src={imageUrl} 
              alt={zine.IMMAGINE?.alternativeText || 'Zine image'} 
              className={styles.zineImage}
            />
          </div>
        )}

        {/* SVG Inline */}
        {zine.SVG && (
          <div className={styles.svgContainer}>
            {loadingSvg ? (
              <div className={styles.svgLoader}>Caricamento SVG...</div>
            ) : svgContent ? (
              <>
                <div 
                  className={styles.svgContent}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
                {/* Pulsante Download sotto l'SVG */}
                <div className={styles.downloadButtonContainer}>
                  <DownloadButton
                    fileUrl={fileUrl}
                    fileName={fileName}
                    color={svgColor || (bgColor === 'black' ? '#ffffff' : '#000000')}
                    onError={(message) => setErrorMessage(message)}
                  />
                </div>
                {/* Mostra avviso se c'è un errore */}
                {errorMessage && (
                  <div className={styles.errorMessage}>
                    {errorMessage}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.svgError}>SVG non disponibile</div>
            )}
          </div>
        )}

        {/* Descrizione */}
        {!hideDescription && zine.DESCRIZIONE && (
          <div className={styles.description}>
            <ReactMarkdown>{zine.DESCRIZIONE}</ReactMarkdown>
          </div>
        )}

        {/* Pulsante Download File */}
        {!hideDownload && fileUrl && (
          <div className={styles.downloadContainer}>
            <a 
              href={fileUrl} 
              download={fileName}
              className={styles.downloadButton}
            >
              Scarica
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
