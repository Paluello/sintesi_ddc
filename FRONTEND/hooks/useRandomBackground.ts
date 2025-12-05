'use client';

import { useState, useEffect } from 'react';
import { getRandomBackgroundColor, BackgroundColor } from '@/lib/backgroundColors';

/**
 * Hook per gestire il colore di sfondo casuale della pagina
 * Il colore viene selezionato una volta al mount e persiste durante la sessione
 * Per cambiare il colore, è necessario ricaricare la pagina
 * 
 * @returns Il colore di sfondo selezionato
 */
export function useRandomBackground(): BackgroundColor {
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>(() => {
    // Inizializza con un colore casuale al primo render
    // Questo garantisce che ogni ricaricamento della pagina produca un colore diverso
    if (typeof window !== 'undefined') {
      return getRandomBackgroundColor();
    }
    // Fallback per SSR
    return '#802928';
  });

  // Il colore viene impostato solo al mount, non cambia durante la sessione
  // Questo garantisce che il colore rimanga consistente fino al prossimo ricaricamento
  useEffect(() => {
    // Il colore è già stato inizializzato nello stato iniziale
    // Questo effect può essere usato per logica aggiuntiva se necessario
  }, []);

  return backgroundColor;
}



