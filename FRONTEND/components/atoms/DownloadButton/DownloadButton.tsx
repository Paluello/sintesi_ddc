'use client';

import { useState, useEffect } from 'react';
import { getSVGWithColor } from '@/lib/svgColorUtils';
import styles from './DownloadButton.module.css';

interface DownloadButtonProps {
  fileUrl: string | null;
  fileName?: string;
  color?: string | null;
  onError?: (message: string) => void;
}

export default function DownloadButton({ fileUrl, fileName, color, onError }: DownloadButtonProps) {
  const [buttonSvgUrl, setButtonSvgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadButtonSvg = async () => {
      try {
        setLoading(true);
        const svgPath = '/svg_artefatti/zine/pulsante_download.svg';
        
        if (color) {
          // Usa il colore estratto dall'SVG della zine
          const coloredSvgUrl = await getSVGWithColor(svgPath, color);
          setButtonSvgUrl(coloredSvgUrl);
        } else {
          // Usa il colore di default
          const defaultColor = '#ffffff';
          const coloredSvgUrl = await getSVGWithColor(svgPath, defaultColor);
          setButtonSvgUrl(coloredSvgUrl);
        }
      } catch (error) {
        console.error('Errore nel caricamento del pulsante SVG:', error);
        setButtonSvgUrl('/svg_artefatti/zine/pulsante_download.svg');
      } finally {
        setLoading(false);
      }
    };

    loadButtonSvg();
  }, [color]);

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (!fileUrl) {
      const errorMessage = 'Il file non è disponibile per il download';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      return;
    }

    try {
      // Prova a scaricare il file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = 'Errore durante il download del file';
      console.error(errorMessage, error);
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        Caricamento...
      </div>
    );
  }

  return (
    <button
      onClick={handleDownload}
      className={styles.downloadButton}
      aria-label="Scarica file"
    >
      {buttonSvgUrl && (
        <img 
          src={buttonSvgUrl} 
          alt="Download" 
          className={styles.buttonSvg}
        />
      )}
    </button>
  );
}
