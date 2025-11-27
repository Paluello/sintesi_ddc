'use client';

import { useState } from 'react';
import styles from './CenteredButton.module.css';

interface CenteredButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
}

export default function CenteredButton({ onClick, children = 'Clicca qui' }: CenteredButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    // Reset dopo l'animazione
    setTimeout(() => {
      setIsPressed(false);
    }, 300);
    onClick?.();
  };

  return (
    <div className={styles.buttonWrapper}>
      <div 
        className={`${styles.blackSquare} ${isPressed ? styles.squarePressed : ''}`}
      />
      <button 
        onClick={handleClick} 
        className={`${styles.centeredButton} ${isPressed ? styles.pressed : ''}`}
      >
        {children}
      </button>
    </div>
  );
}

