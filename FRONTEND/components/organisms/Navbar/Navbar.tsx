'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navbarRef = useRef<HTMLElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const checkProximity = () => {
      if (!navbarRef.current) return;

      const navbarRect = navbarRef.current.getBoundingClientRect();
      const navbarWidth = navbarRect.width;
      const padding = 32; // 16px per lato
      const availableWidth = navbarWidth - padding;

      // Larghezza totale degli elementi quando sono a dimensione normale
      // Pulsante menu: 40px + Logo: ~127px + Clone: 40px = ~207px
      const totalElementsWidth = 207;
      
      // Soglia minima di larghezza disponibile prima di iniziare a rimpicciolire
      const minAvailableWidth = 250;
      
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
  }, [isOpen]); // Aggiungi isOpen come dipendenza per ricontrollare quando il menu si apre/chiude

  return (
    <nav 
      ref={navbarRef}
      className={styles.navbar} 
      data-navbar
      style={{ '--navbar-scale': scale } as React.CSSProperties}
    >
      <button
        ref={menuButtonRef}
        className={styles.menuButton}
        onClick={toggleMenu}
        aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
        type="button"
      >
        <Image
          src={isOpen ? '/images/tasti/butt_cross.svg' : '/images/tasti/butt_menù.svg'}
          alt={isOpen ? 'Chiudi menu' : 'Apri menu'}
          width={50}
          height={50}
          className={`${styles.icon} ${!isOpen ? styles.iconWhite : ''}`}
        />
      </button>
      
      <img
        src="/images/titolo.svg"
        alt="Titolo"
        className={styles.logo}
      />
      
      <button
        className={styles.menuButtonClone}
        type="button"
        aria-hidden="true"
        tabIndex={-1}
      >
        <Image
          src="/images/tasti/butt_menù.svg"
          alt=""
          width={50}
          height={50}
          className={styles.icon}
        />
      </button>
      
      {isOpen && (
        <div className={styles.menu}>
          <div className={styles.menuContent}>
            <span className={styles.menuText}>menù</span>
          </div>
        </div>
      )}
    </nav>
  );
}

