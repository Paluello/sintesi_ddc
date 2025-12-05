'use client';

import { useEffect, useState } from 'react';
import styles from './SideMenu.module.css';
import IconButton from '../../atoms/IconButton/IconButton';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Blocca lo scroll del body quando il menu è aperto
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Deve corrispondere alla durata della transizione CSS
      
      // Ripristina lo scroll
      document.body.style.overflow = '';
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay per chiudere cliccando fuori */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu laterale */}
      <div className={`${styles.sideMenu} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Menu</h2>
          {/* Usiamo un bottone di chiusura o l'icona menu stessa per chiudere? 
              Per ora metto un semplice testo o icona di chiusura standard se necessario,
              ma spesso si usa la X o si clicca fuori.
              Userò un div placeholder per l'header per ora.
          */}
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>
        
        <div className={styles.content}>
          <p>Contenuto del menu...</p>
          <ul className={styles.menuList}>
            <li>Opzione 1</li>
            <li>Opzione 2</li>
            <li>Opzione 3</li>
            <li>Impostazioni</li>
          </ul>
        </div>
      </div>
    </>
  );
}
