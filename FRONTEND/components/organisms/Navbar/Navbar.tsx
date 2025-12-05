'use client';

import { useState, useEffect, useRef } from 'react';
import { useLoadingScreen } from '@/components/providers/LoadingScreenProvider';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scale, setScale] = useState(1);
  const navbarRef = useRef<HTMLElement>(null);
  const { isVisible: isLoadingScreenVisible } = useLoadingScreen();

  useEffect(() => {
    const checkProximity = () => {
      if (!navbarRef.current) return;

      const navbarRect = navbarRef.current.getBoundingClientRect();
      const navbarWidth = navbarRect.width;
      const padding = 32; // 16px per lato
      const availableWidth = navbarWidth - padding;

      // Larghezza totale degli elementi quando sono a dimensione normale
      // Solo Logo: ~127px
      const totalElementsWidth = 130;
      
      // Soglia minima di larghezza disponibile prima di iniziare a rimpicciolire
      const minAvailableWidth = 180;
      
      // Se la larghezza disponibile è minore della soglia, calcola la scala
      if (availableWidth < minAvailableWidth) {
        // Calcola una scala proporzionale alla larghezza disponibile
        // La scala minima sarà 0.7 (70% della dimensione originale)
        const minScale = 0.7;
        const maxScale = 1;
        
        // Mappa la larghezza disponibile alla scala
        const normalizedWidth = Math.max(totalElementsWidth, availableWidth);
        const calculatedScale = minScale + ((normalizedWidth - totalElementsWidth) / (minAvailableWidth - totalElementsWidth)) * (maxScale - minScale);
        setScale(Math.max(minScale, Math.min(maxScale, calculatedScale)));
      } else {
        setScale(1);
      }
    };

    // Controlla al mount e al resize
    checkProximity();
    window.addEventListener('resize', checkProximity);
    
    // Usa un piccolo delay per assicurarsi che il DOM sia aggiornato
    const timeoutId = setTimeout(checkProximity, 100);

    return () => {
      window.removeEventListener('resize', checkProximity);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <nav 
      ref={navbarRef}
      className={`${styles.navbar} ${isLoadingScreenVisible ? styles.hidden : ''}`}
      data-navbar
      style={{ '--navbar-scale': scale } as React.CSSProperties}
    >
      <img
        src="/images/titolo.svg"
        alt="Titolo"
        className={styles.logo}
      />
    </nav>
  );
}
