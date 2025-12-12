'use client';

import { useEffect, useState } from 'react';
import { usePageTransition } from '@/components/providers/PageTransitionProvider';
import styles from './SideMenu.module.css';
import IconButton from '../../atoms/IconButton/IconButton';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  path: string;
  menuImage: string;
}

const menuItems: MenuItem[] = [
  { label: 'Il progetto', path: '/', menuImage: '/images/menu/progetto.svg' },
  { label: 'Spazio digitale', path: '/spazio-digitale', menuImage: '/images/menu/bacheca.svg' },
  { label: 'Zine', path: '/zine', menuImage: '/images/menu/zine.svg' },
  { label: 'Manifesti', path: '/manifesti', menuImage: '/images/menu/manifesti.svg' },
  { label: 'Videocast', path: '/videocast', menuImage: '/images/menu/video-podcast.svg' },
  { label: 'Guerrilla', path: '/guerrilla', menuImage: '/images/menu/guerrilla.svg' },
];

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { startTransition } = usePageTransition();

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldRender(true);
      // Blocca lo scroll del body quando il menu è aperto
      document.body.style.overflow = 'hidden';
    } else if (shouldRender) {
      setIsClosing(true);
      // Ripristina lo scroll
      document.body.style.overflow = '';
      
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 280); // Deve corrispondere alla durata della transizione CSS
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const handleBalloonClick = (path: string) => {
    onClose();
    startTransition(path);
  };

  if (!shouldRender) return null;

  return (
    <div className={`${styles.sideMenu} ${isOpen ? styles.open : ''} ${isClosing ? styles.closing : ''}`}>
      <div className={styles.menuButton}>
        <IconButton
          icon="cross"
          onClick={onClose}
          aria-label="Chiudi menu"
        />
      </div>
      <div className={styles.content}>
        <div className={styles.menuSection}>
          {/* Primo elemento: Il progetto */}
          <div
            key={menuItems[0].path}
            className={styles.balloonItem}
            onClick={() => handleBalloonClick(menuItems[0].path)}
            style={{
              animationDelay: isOpen 
                ? `0ms` 
                : isClosing 
                  ? `${(menuItems.length - 1) * 30}ms` 
                  : '0ms',
            }}
          >
            <img 
              src={menuItems[0].menuImage} 
              alt={menuItems[0].label}
              className={styles.balloonImage}
            />
          </div>
          
          {/* Gruppo degli altri elementi */}
          <div className={styles.groupedItems}>
            {menuItems.slice(1).map((item, index) => (
              <div
                key={item.path}
                className={styles.balloonItem}
                onClick={() => handleBalloonClick(item.path)}
                style={{
                  animationDelay: isOpen 
                    ? `${(index + 1) * 100}ms` 
                    : isClosing 
                      ? `${(menuItems.length - 2 - index) * 30}ms` 
                      : '0ms',
                }}
              >
                <img 
                  src={item.menuImage} 
                  alt={item.label}
                  className={styles.balloonImage}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


