'use client';

import { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  onComplete?: () => void;
  loops?: number; // Numero di loop da completare (se server connesso)
  isServerConnected?: boolean | null; // null = ancora in controllo, true = connesso, false = non connesso
  backgroundColor?: string; // Colore di sfondo da applicare dinamicamente
}

export default function LoadingScreen({ 
  onComplete, 
  loops = 2,
  isServerConnected = null,
  backgroundColor = '#802928' // Fallback al colore originale
}: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [messageText, setMessageText] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<any>(null);
  const serverConnectedTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Carica l'animazione JSON
  useEffect(() => {
    fetch('/animations/loading.json')
      .then((res) => res.json())
      .then((data) => {
        setAnimationData(data);
      })
      .catch((error) => {
        console.error('Errore nel caricamento dell\'animazione:', error);
      });
  }, []);

  // Traccia quando il messaggio "Fatto!" viene mostrato
  const fattoMessageShownTimeRef = useRef<number | null>(null);

  // Gestisce il messaggio dopo 5 secondi se il server non è connesso
  // Il timer parte dal mount del componente
  useEffect(() => {
    const timer = setTimeout(() => {
      // Mostra il messaggio solo se il server non è ancora connesso dopo 5 secondi
      if (isServerConnected === false || isServerConnected === null) {
        setMessageText('Forse abbiamo qualche problemino tecnico... ci stiamo lavorando!');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []); // Esegui solo al mount

  // Traccia quando il server si connette e cambia il messaggio in "Fatto!" se necessario
  useEffect(() => {
    if (isServerConnected === true) {
      // Salva il momento in cui il server si è connesso
      if (serverConnectedTimeRef.current === null) {
        serverConnectedTimeRef.current = Date.now();
      }
      
      // Cambia il messaggio in "Fatto!" se il messaggio di errore era già visibile
      if (messageText !== null && messageText !== 'Fatto!' && messageText.includes('problemino tecnico')) {
        setMessageText('Fatto!');
        fattoMessageShownTimeRef.current = Date.now();
      }
    }
  }, [isServerConnected, messageText]);

  // Gestisce il fade out quando il server è connesso
  useEffect(() => {
    if (!animationData || isServerConnected !== true || serverConnectedTimeRef.current === null) return;

    // Calcola la durata di un loop dall'animazione
    // op = out point (frame finale), fr = frame rate (fps)
    const frameRate = animationData.fr || 12; // default 12 fps
    const outPoint = animationData.op || 21; // default 21 frames
    const loopDurationMs = (outPoint / frameRate) * 1000; // durata di un loop in ms
    const totalDurationMs = loopDurationMs * loops; // durata totale per N loop

    // Se il messaggio "Fatto!" è visibile, assicurati che rimanga visibile per almeno 1 secondo
    const minMessageDisplayTime = messageText === 'Fatto!' && fattoMessageShownTimeRef.current !== null 
      ? Math.max(0, 1000 - (Date.now() - fattoMessageShownTimeRef.current))
      : 0;

    // Usa il momento in cui il server si è connesso come punto di partenza
    const checkComplete = () => {
      const elapsed = Date.now() - serverConnectedTimeRef.current!;
      const remaining = Math.max(0, totalDurationMs - elapsed);
      
      // Assicurati che il messaggio "Fatto!" rimanga visibile per almeno 1 secondo
      const finalRemaining = Math.max(remaining, minMessageDisplayTime);
      
      setTimeout(() => {
        setIsFading(true);
        // Aspetta la transizione CSS prima di nascondere completamente e chiamare onComplete
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 300);
      }, finalRemaining);
    };

    checkComplete();
  }, [onComplete, loops, animationData, isServerConnected, messageText]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`${styles.loadingScreen} ${isFading ? styles.fadeOut : ''}`}
      style={{ backgroundColor }}
    >
      <div className={styles.animationContainer}>
        {animationData && (
          <Lottie 
            animationData={animationData} 
            loop={true}
            className={styles.animation}
          />
        )}
      </div>
      {messageText !== null && (
        <div className={styles.errorMessage}>
          {messageText}
        </div>
      )}
    </div>
  );
}

