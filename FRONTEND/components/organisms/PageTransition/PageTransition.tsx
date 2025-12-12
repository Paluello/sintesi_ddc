'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import { usePageTransition } from '@/components/providers/PageTransitionProvider';
import styles from './PageTransition.module.css';

export default function PageTransition() {
  const { isTransitioning, targetPath, completeTransition } = usePageTransition();
  const router = useRouter();
  const [animationData, setAnimationData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1080, height: 1920 });
  const originalDimensionsRef = useRef({ width: 1080, height: 1920 });
  const navigationExecutedRef = useRef(false);

  // Carica l'animazione JSON
  useEffect(() => {
    fetch('/animations/pagetransition.json')
      .then((res) => res.json())
      .then((data) => {
        setAnimationData(data);
        // Estrai le dimensioni originali dall'animazione
        const originalWidth = data.w || 1080;
        const originalHeight = data.h || 1920;
        originalDimensionsRef.current = { width: originalWidth, height: originalHeight };
        
        // Calcola le dimensioni iniziali responsive
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const animationAspectRatio = originalWidth / originalHeight;
        const viewportAspectRatio = viewportWidth / viewportHeight;

        let width: number;
        let height: number;

        // Se la viewport è più larga dell'animazione (in proporzione)
        if (viewportAspectRatio > animationAspectRatio) {
          // La viewport è più larga, quindi scala in base all'altezza
          height = viewportHeight;
          width = height * animationAspectRatio;
        } else {
          // La viewport è più alta, quindi scala in base alla larghezza
          width = viewportWidth;
          height = width / animationAspectRatio;
        }

        // Assicurati che copra sempre tutta la viewport (cover)
        if (width < viewportWidth) {
          width = viewportWidth;
          height = width / animationAspectRatio;
        }
        if (height < viewportHeight) {
          height = viewportHeight;
          width = height * animationAspectRatio;
        }

        setDimensions({ width, height });
      })
      .catch((error) => {
        console.error('Errore nel caricamento dell\'animazione di transizione:', error);
      });
  }, []);

  // Calcola le dimensioni responsive basate sulla viewport
  useEffect(() => {
    const calculateDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const { width: originalWidth, height: originalHeight } = originalDimensionsRef.current;
      const animationAspectRatio = originalWidth / originalHeight;
      const viewportAspectRatio = viewportWidth / viewportHeight;

      let width: number;
      let height: number;

      // Se la viewport è più larga dell'animazione (in proporzione)
      if (viewportAspectRatio > animationAspectRatio) {
        // La viewport è più larga, quindi scala in base all'altezza
        height = viewportHeight;
        width = height * animationAspectRatio;
      } else {
        // La viewport è più alta, quindi scala in base alla larghezza
        width = viewportWidth;
        height = width / animationAspectRatio;
      }

      // Assicurati che copra sempre tutta la viewport (cover)
      if (width < viewportWidth) {
        width = viewportWidth;
        height = width / animationAspectRatio;
      }
      if (height < viewportHeight) {
        height = viewportHeight;
        width = height * animationAspectRatio;
      }

      return { width, height };
    };

    // Ricalcola al resize della finestra
    const handleResize = () => {
      const { width, height } = calculateDimensions();
      setDimensions({ width, height });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Gestisce la transizione quando isTransitioning diventa true
  useEffect(() => {
    if (!isTransitioning || !targetPath || !animationData) {
      // Reset quando non è in transizione
      if (!isTransitioning) {
        setIsVisible(false);
        navigationExecutedRef.current = false;
      }
      return;
    }

    // Mostra l'animazione
    setIsVisible(true);
    navigationExecutedRef.current = false;

    // Calcola la durata dell'animazione
    const frameRate = animationData.fr || 25; // 25 fps
    const outPoint = animationData.op || 100; // 100 frames
    const totalDurationMs = (outPoint / frameRate) * 1000; // 4000ms = 4 secondi
    const halfDurationMs = totalDurationMs / 2; // 2000ms = 2 secondi (metà)

    // A metà animazione (2 secondi), cambia pagina
    const navigationTimer = setTimeout(() => {
      if (!navigationExecutedRef.current && targetPath) {
        navigationExecutedRef.current = true;
        router.push(targetPath);
      }
    }, halfDurationMs);

    // Alla fine dell'animazione (4 secondi), completa la transizione
    const completeTimer = setTimeout(() => {
      completeTransition();
    }, totalDurationMs);

    return () => {
      clearTimeout(navigationTimer);
      clearTimeout(completeTimer);
    };
  }, [isTransitioning, targetPath, animationData, router, completeTransition]);

  if (!isVisible || !animationData) {
    return null;
  }

  return (
    <div className={styles.pageTransition}>
      <div 
        className={styles.animationWrapper}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      >
        <Lottie 
          animationData={animationData} 
          loop={false}
          autoplay={true}
          className={styles.animation}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}
