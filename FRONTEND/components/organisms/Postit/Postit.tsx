'use client';

import { useState, useRef, useEffect, CSSProperties, memo, useCallback, useMemo } from 'react';
import localFont from 'next/font/local';
import { Postit as PostitType, PostitStyle } from '@/types/postit';
import styles from './Postit.module.css';
import { loadAllSafeAreas, loadAllPaths, type SafeArea } from '@/lib/svgSafeArea';

const BALLOON_IMAGES: Record<PostitStyle, string> = {
  a: '/images/baloons/baloon-1.svg',
  b: '/images/baloons/baloon-2.svg',
  c: '/images/baloons/baloon-3.svg',
  d: '/images/baloons/baloon-4.svg',
};

const DEFAULT_BALLOON = BALLOON_IMAGES.a;
// ViewBox standard degli SVG (240x120)
const DEFAULT_VIEWBOX = { width: 240, height: 120, x: 0, y: 0 };

const geistMonoFont = localFont({
  src: [
    {
      path: '../../../font/mono/GeistMono-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
});

// Safe areas di fallback (valori hardcoded per compatibilità)
const FALLBACK_SAFE_AREAS: Record<PostitStyle, SafeArea> = {
  a: {
    top: (39.6 / DEFAULT_VIEWBOX.height) * 100,
    bottom: ((DEFAULT_VIEWBOX.height - (39.6 + 38.6)) / DEFAULT_VIEWBOX.height) * 100,
    left: (45.6 / DEFAULT_VIEWBOX.width) * 100,
    right: ((DEFAULT_VIEWBOX.width - (45.6 + 179)) / DEFAULT_VIEWBOX.width) * 100,
  },
  b: {
    top: (57.8 / DEFAULT_VIEWBOX.height) * 100,
    bottom: ((DEFAULT_VIEWBOX.height - (57.8 + 39.7)) / DEFAULT_VIEWBOX.height) * 100,
    left: (36 / DEFAULT_VIEWBOX.width) * 100,
    right: ((DEFAULT_VIEWBOX.width - (36 + 171.8)) / DEFAULT_VIEWBOX.width) * 100,
  },
  c: {
    top: (55.8 / DEFAULT_VIEWBOX.height) * 100,
    bottom: ((DEFAULT_VIEWBOX.height - (55.8 + 41.6)) / DEFAULT_VIEWBOX.height) * 100,
    left: (42.7 / DEFAULT_VIEWBOX.width) * 100,
    right: ((DEFAULT_VIEWBOX.width - (42.7 + 172.9)) / DEFAULT_VIEWBOX.width) * 100,
  },
  d: {
    top: (24.5 / DEFAULT_VIEWBOX.height) * 100,
    bottom: ((DEFAULT_VIEWBOX.height - (24.5 + 39.5)) / DEFAULT_VIEWBOX.height) * 100,
    left: (27.7 / DEFAULT_VIEWBOX.width) * 100,
    right: ((DEFAULT_VIEWBOX.width - (27.7 + 174.1)) / DEFAULT_VIEWBOX.width) * 100,
  },
};

// Cache globale per le safe areas caricate (condivisa tra tutte le istanze)
let loadedSafeAreas: Record<string, SafeArea> | null = null;
let loadingPromise: Promise<Record<string, SafeArea>> | null = null;

// Cache globale per i path caricati (condivisa tra tutte le istanze)
let loadedPaths: Record<string, { path: string; viewBox: { width: number; height: number; x: number; y: number } }> | null = null;
let loadingPathsPromise: Promise<Record<string, { path: string; viewBox: { width: number; height: number; x: number; y: number } }>> | null = null;

interface PostitProps {
  postit: PostitType;
  onClick: () => void;
  onPositionUpdate: (id: number, x: number, y: number) => Promise<void>;
  canvasTransform?: { scale: number; translateX: number; translateY: number };
  viewportToCanvas?: (x: number, y: number) => { x: number; y: number };
  animationDelay?: number; // Delay in millisecondi per l'animazione di entrata
}

function Postit({ 
  postit, 
  onClick, 
  onPositionUpdate, 
  canvasTransform,
  viewportToCanvas,
  animationDelay
}: PostitProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: postit.X || 0, y: postit.Y || 0 });
  const [animationComplete, setAnimationComplete] = useState(false);
  const [safeAreas, setSafeAreas] = useState<Record<string, SafeArea> | null>(loadedSafeAreas);
  const [paths, setPaths] = useState<Record<string, { path: string; viewBox: { width: number; height: number; x: number; y: number } }> | null>(loadedPaths);
  const dragStateRef = useRef<{
    offsetX: number;
    offsetY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
    finalX: number;
    finalY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasClickedRef = useRef(false);
  const justDraggedRef = useRef(false); // Traccia se c'è stato un drag per prevenire click sul container
  const rafIdRef = useRef<number | null>(null);
  const containerRectRef = useRef<DOMRect | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isUpdatingPositionRef = useRef(false); // Flag per indicare che stiamo aspettando la risposta dell'API
  const resolvedStyle = (() => {
    const normalized = postit.STILE?.toLowerCase();
    if (normalized && ['a', 'b', 'c', 'd'].includes(normalized)) {
      return normalized as PostitStyle;
    }
    return 'a' as PostitStyle;
  })();

  // Carica le safe areas dagli SVG al mount
  useEffect(() => {
    // Se sono già caricate, non fare nulla
    if (loadedSafeAreas) {
      setSafeAreas(loadedSafeAreas);
    } else if (loadingPromise) {
      // Se c'è già un caricamento in corso, aspetta quello
      loadingPromise.then((areas) => {
        loadedSafeAreas = areas;
        setSafeAreas(areas);
      }).catch((error) => {
        console.error('Errore nel caricamento delle safe areas:', error);
      });
    } else {
      // Altrimenti, inizia il caricamento
      loadingPromise = loadAllSafeAreas(BALLOON_IMAGES);
      loadingPromise.then((areas) => {
        loadedSafeAreas = areas;
        setSafeAreas(areas);
        loadingPromise = null;
      }).catch((error) => {
        console.error('Errore nel caricamento delle safe areas:', error);
        loadingPromise = null;
      });
    }
  }, []);

  // Carica i path dagli SVG al mount
  useEffect(() => {
    // Se sono già caricati, non fare nulla
    if (loadedPaths) {
      setPaths(loadedPaths);
    } else if (loadingPathsPromise) {
      // Se c'è già un caricamento in corso, aspetta quello
      loadingPathsPromise.then((pathsData) => {
        loadedPaths = pathsData;
        setPaths(pathsData);
        console.log('Path caricati:', pathsData);
      }).catch((error) => {
        console.error('Errore nel caricamento dei path:', error);
      });
    } else {
      // Altrimenti, inizia il caricamento
      loadingPathsPromise = loadAllPaths(BALLOON_IMAGES);
      loadingPathsPromise.then((pathsData) => {
        loadedPaths = pathsData;
        setPaths(pathsData);
        loadingPathsPromise = null;
        console.log('Path caricati:', pathsData);
      }).catch((error) => {
        console.error('Errore nel caricamento dei path:', error);
        loadingPathsPromise = null;
      });
    }
  }, []);

  const baloonImageSrc = BALLOON_IMAGES[resolvedStyle] || DEFAULT_BALLOON;
  // Usa il path caricato dall'SVG, altrimenti usa un path vuoto (non cliccabile finché non è caricato)
  const pathData = paths?.[resolvedStyle];
  const baloonPath = pathData?.path || '';
  const viewBox = pathData?.viewBox ? { width: pathData.viewBox.width, height: pathData.viewBox.height } : DEFAULT_VIEWBOX;
  
  // Usa le safe areas caricate dagli SVG, altrimenti usa i fallback
  const safeArea = useMemo(() => {
    return safeAreas?.[resolvedStyle] || FALLBACK_SAFE_AREAS[resolvedStyle];
  }, [safeAreas, resolvedStyle]);
  
  const safeAreaVars: CSSProperties = useMemo(() => ({
    '--postit-safe-inset-top': `${safeArea.top}%`,
    '--postit-safe-inset-right': `${safeArea.right}%`,
    '--postit-safe-inset-bottom': `${safeArea.bottom}%`,
    '--postit-safe-inset-left': `${safeArea.left}%`,
    '--postit-inner-padding': '0px',
    '--postit-safe-radius': '0px',
  } as CSSProperties), [safeArea]);

  // Sync position with prop changes
  // Non sincronizzare se stiamo aspettando la risposta dell'API dopo un drag
  useEffect(() => {
    if (!isDragging && !isUpdatingPositionRef.current) {
      // Solo sincronizza se la posizione è significativamente diversa (evita micro-movimenti)
      const propX = postit.X || 0;
      const propY = postit.Y || 0;
      // Usa una funzione di aggiornamento per accedere al valore corrente di position
      setPosition((currentPos) => {
        const deltaX = Math.abs(propX - currentPos.x);
        const deltaY = Math.abs(propY - currentPos.y);
        // Sincronizza solo se la differenza è significativa (> 1px) per evitare sfarfallii
        if (deltaX > 1 || deltaY > 1) {
          return { x: propX, y: propY };
        }
        return currentPos; // Non cambiare se la differenza è minima
      });
    }
  }, [postit.X, postit.Y, isDragging]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Funzione ottimizzata per aggiornare la posizione usando requestAnimationFrame
  const updatePositionOptimized = useCallback((newX: number, newY: number) => {
    // Sempre aggiorna la posizione pending (anche se c'è già un RAF in corso)
    pendingPositionRef.current = { x: newX, y: newY };
    
    // Se non c'è già un RAF schedulato, ne creiamo uno
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        // Applica l'ultima posizione pending
        if (pendingPositionRef.current) {
          setPosition(pendingPositionRef.current);
          pendingPositionRef.current = null;
        }
        rafIdRef.current = null;
      });
    }
    // Se c'è già un RAF in corso, non ne creiamo uno nuovo
    // ma la posizione pending verrà aggiornata e applicata al prossimo frame
  }, []);

  const handleMouseDown = (e: React.MouseEvent<SVGPathElement>) => {
    if (e.button !== 0) return; // Only handle left mouse button
    
    wasClickedRef.current = true;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Find the scrollable container (postitsContainer)
    // L'SVG è dentro il div, quindi prendiamo il parent del div
    let container: HTMLElement | null = containerRef.current?.parentElement?.parentElement ?? null;
    while (container) {
      if (container.classList.contains('postitsContainer') || container.hasAttribute('data-postits-container')) {
        break;
      }
      container = container.parentElement;
    }
    
    if (!container) {
      // Fallback to parentElement if postitsContainer not found
      container = containerRef.current?.parentElement?.parentElement ?? null;
    }
    
    if (!container) return;

    // Cache container rect per evitare chiamate costose durante il drag
    containerRectRef.current = container.getBoundingClientRect();
    const containerRect = containerRectRef.current;
    
    // Calculate mouse position relative to container viewport
    const mouseXViewport = e.clientX - containerRect.left;
    const mouseYViewport = e.clientY - containerRect.top;
    
    const initialX = position.x;
    const initialY = position.y;
    
    // Calculate offset in canvas coordinates
    let offsetXCanvas: number;
    let offsetYCanvas: number;
    
    if (viewportToCanvas && canvasTransform) {
      // Convert mouse position to canvas coordinates
      const mouseCanvasCoords = viewportToCanvas(mouseXViewport, mouseYViewport);
      // Calculate offset in canvas coordinates
      offsetXCanvas = mouseCanvasCoords.x - initialX;
      offsetYCanvas = mouseCanvasCoords.y - initialY;
    } else {
      // Fallback: use viewport offset (will be converted later if needed)
      const offsetXViewport = e.clientX - rect.left;
      const offsetYViewport = e.clientY - rect.top;
      offsetXCanvas = offsetXViewport;
      offsetYCanvas = offsetYViewport;
    }

    dragStateRef.current = {
      offsetX: offsetXCanvas,
      offsetY: offsetYCanvas,
      initialX,
      initialY,
      hasMoved: false,
      finalX: initialX,
      finalY: initialY,
    };

    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStateRef.current || !container) return;

      // Usa il rect cached o aggiornalo solo se necessario (meno frequente)
      let containerRect = containerRectRef.current;
      if (!containerRect) {
        containerRect = container.getBoundingClientRect();
        containerRectRef.current = containerRect;
      }
      
      // Mouse position relative to container viewport
      const mouseXViewport = moveEvent.clientX - containerRect.left;
      const mouseYViewport = moveEvent.clientY - containerRect.top;
      
      // Convert mouse position to canvas coordinates and calculate new position
      let newX: number;
      let newY: number;
      
      if (viewportToCanvas && canvasTransform) {
        // Convert mouse position to canvas coordinates
        const mouseCanvasCoords = viewportToCanvas(mouseXViewport, mouseYViewport);
        // New position = mouse position in canvas - offset in canvas
        newX = mouseCanvasCoords.x - dragStateRef.current.offsetX;
        newY = mouseCanvasCoords.y - dragStateRef.current.offsetY;
      } else {
        // Fallback to old behavior if no canvas transform
        const scrollLeft = container.scrollLeft || 0;
        const scrollTop = container.scrollTop || 0;
        newX = mouseXViewport - dragStateRef.current.offsetX + scrollLeft;
        newY = mouseYViewport - dragStateRef.current.offsetY + scrollTop;
      }

      // Check if mouse has moved significantly
      const deltaX = Math.abs(newX - dragStateRef.current.initialX);
      const deltaY = Math.abs(newY - dragStateRef.current.initialY);
      if (deltaX > 5 || deltaY > 5) {
        dragStateRef.current.hasMoved = true;
      }

      // No constraints for infinite canvas - allow free movement
      // Usa updatePositionOptimized invece di setPosition diretto
      updatePositionOptimized(newX, newY);
      if (dragStateRef.current) {
        dragStateRef.current.finalX = newX;
        dragStateRef.current.finalY = newY;
      }
    };

    const handleMouseUp = (upEvent?: MouseEvent) => {
      const dragState = dragStateRef.current;
      setIsDragging(false);
      dragStateRef.current = null;
      containerRectRef.current = null; // Reset cache
      
      // Cancella eventuali RAF pending
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // If moved significantly, update position in backend
      if (dragState?.hasMoved) {
        // Set final position immediately for smooth transition
        setPosition({ x: dragState.finalX, y: dragState.finalY });
        // Segna che stiamo aspettando la risposta dell'API
        isUpdatingPositionRef.current = true;
        // Aggiorna la posizione nel backend
        onPositionUpdate(postit.id, dragState.finalX, dragState.finalY)
          .then(() => {
            // Quando l'API risponde, sincronizza la posizione e resetta il flag
            isUpdatingPositionRef.current = false;
            // La posizione verrà sincronizzata automaticamente dal useEffect quando postit.X/Y cambiano
          })
          .catch(() => {
            // In caso di errore, resetta comunque il flag
            isUpdatingPositionRef.current = false;
          });
        wasClickedRef.current = false;
        // Segna che c'è stato un drag per prevenire click sul container
        justDraggedRef.current = true;
        
        // Previeni il click sul container per un breve periodo
        // Trova il container principale
        let mainContainer: HTMLElement | null = null;
        let current: HTMLElement | null = containerRef.current?.parentElement ?? null;
        while (current) {
          if (current.hasAttribute('data-postits-container') || current.classList.contains('postitsContainer')) {
            mainContainer = current.parentElement;
            break;
          }
          current = current.parentElement;
        }
        
        const preventClick = (e: MouseEvent) => {
          // Previeni solo se il click è sul container principale
          if (mainContainer && (mainContainer.contains(e.target as Node) || e.target === mainContainer)) {
            e.stopPropagation();
            e.preventDefault();
          }
        };
        
        // Aggiungi listener temporaneo per prevenire click sul container
        document.addEventListener('click', preventClick, { capture: true, once: false });
        
        // Rimuovi il listener dopo un breve delay
        setTimeout(() => {
          document.removeEventListener('click', preventClick, { capture: true });
          justDraggedRef.current = false;
        }, 100);
      }
      // Note: click handling is done in onClick handler

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGPathElement>) => {
    if (e.touches.length !== 1) return; // Solo un dito
    
    wasClickedRef.current = true;
    // NON chiamare preventDefault qui - lo chiameremo solo durante il drag
    // Questo permette al click di funzionare normalmente
    e.stopPropagation();
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Find the scrollable container (postitsContainer)
    // L'SVG è dentro il div, quindi prendiamo il parent del div
    let container: HTMLElement | null = containerRef.current?.parentElement?.parentElement ?? null;
    while (container) {
      if (container.classList.contains('postitsContainer') || container.hasAttribute('data-postits-container')) {
        break;
      }
      container = container.parentElement;
    }
    
    if (!container) {
      container = containerRef.current?.parentElement?.parentElement ?? null;
    }
    
    if (!container) return;

    // Cache container rect per evitare chiamate costose durante il drag
    containerRectRef.current = container.getBoundingClientRect();
    const containerRect = containerRectRef.current;
    
    // Calculate touch position relative to container viewport
    const touchXViewport = touch.clientX - containerRect.left;
    const touchYViewport = touch.clientY - containerRect.top;
    
    const initialX = position.x;
    const initialY = position.y;
    
    // Calculate offset in canvas coordinates
    let offsetXCanvas: number;
    let offsetYCanvas: number;
    
    if (viewportToCanvas && canvasTransform) {
      // Convert touch position to canvas coordinates
      const touchCanvasCoords = viewportToCanvas(touchXViewport, touchYViewport);
      // Calculate offset in canvas coordinates
      offsetXCanvas = touchCanvasCoords.x - initialX;
      offsetYCanvas = touchCanvasCoords.y - initialY;
    } else {
      // Fallback: use viewport offset
      const offsetXViewport = touch.clientX - rect.left;
      const offsetYViewport = touch.clientY - rect.top;
      offsetXCanvas = offsetXViewport;
      offsetYCanvas = offsetYViewport;
    }

    dragStateRef.current = {
      offsetX: offsetXCanvas,
      offsetY: offsetYCanvas,
      initialX,
      initialY,
      hasMoved: false,
      finalX: initialX,
      finalY: initialY,
    };

    setIsDragging(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!dragStateRef.current || !container || moveEvent.touches.length !== 1) return;

      const touch = moveEvent.touches[0];
      
      // Usa il rect cached o aggiornalo solo se necessario (meno frequente)
      let containerRect = containerRectRef.current;
      if (!containerRect) {
        containerRect = container.getBoundingClientRect();
        containerRectRef.current = containerRect;
      }
      
      // Touch position relative to container viewport
      const touchXViewport = touch.clientX - containerRect.left;
      const touchYViewport = touch.clientY - containerRect.top;
      
      // Convert touch position to canvas coordinates and calculate new position
      let newX: number;
      let newY: number;
      
      if (viewportToCanvas && canvasTransform) {
        // Convert touch position to canvas coordinates
        const touchCanvasCoords = viewportToCanvas(touchXViewport, touchYViewport);
        // New position = touch position in canvas - offset in canvas
        newX = touchCanvasCoords.x - dragStateRef.current.offsetX;
        newY = touchCanvasCoords.y - dragStateRef.current.offsetY;
      } else {
        // Fallback to old behavior if no canvas transform
        const scrollLeft = container.scrollLeft || 0;
        const scrollTop = container.scrollTop || 0;
        newX = touchXViewport - dragStateRef.current.offsetX + scrollLeft;
        newY = touchYViewport - dragStateRef.current.offsetY + scrollTop;
      }

      // Check if touch has moved significantly
      const deltaX = Math.abs(newX - dragStateRef.current.initialX);
      const deltaY = Math.abs(newY - dragStateRef.current.initialY);
      if (deltaX > 5 || deltaY > 5) {
        dragStateRef.current.hasMoved = true;
        // Prevent scroll during drag
        moveEvent.preventDefault();
      }

      // No constraints for infinite canvas - allow free movement
      // Usa updatePositionOptimized invece di setPosition diretto
      updatePositionOptimized(newX, newY);
      if (dragStateRef.current) {
        dragStateRef.current.finalX = newX;
        dragStateRef.current.finalY = newY;
      }
    };

    const handleTouchEnd = () => {
      const dragState = dragStateRef.current;
      setIsDragging(false);
      dragStateRef.current = null;
      containerRectRef.current = null; // Reset cache
      
      // Cancella eventuali RAF pending
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // If moved significantly, update position in backend
      if (dragState?.hasMoved) {
        // Set final position immediately for smooth transition
        setPosition({ x: dragState.finalX, y: dragState.finalY });
        // Segna che stiamo aspettando la risposta dell'API
        isUpdatingPositionRef.current = true;
        // Aggiorna la posizione nel backend
        onPositionUpdate(postit.id, dragState.finalX, dragState.finalY)
          .then(() => {
            // Quando l'API risponde, sincronizza la posizione e resetta il flag
            isUpdatingPositionRef.current = false;
            // La posizione verrà sincronizzata automaticamente dal useEffect quando postit.X/Y cambiano
          })
          .catch(() => {
            // In caso di errore, resetta comunque il flag
            isUpdatingPositionRef.current = false;
          });
        wasClickedRef.current = false;
        // Segna che c'è stato un drag per prevenire click sul container
        justDraggedRef.current = true;
        
        // Previeni il click sul container per un breve periodo (anche per touch)
        // Trova il container principale
        let mainContainer: HTMLElement | null = null;
        let current: HTMLElement | null = containerRef.current?.parentElement ?? null;
        while (current) {
          if (current.hasAttribute('data-postits-container') || current.classList.contains('postitsContainer')) {
            mainContainer = current.parentElement;
            break;
          }
          current = current.parentElement;
        }
        
        const preventClick = (e: MouseEvent | TouchEvent) => {
          // Previeni solo se il click è sul container principale
          if (mainContainer && (mainContainer.contains(e.target as Node) || e.target === mainContainer)) {
            e.stopPropagation();
            e.preventDefault();
          }
        };
        
        // Aggiungi listener temporaneo per prevenire click sul container
        document.addEventListener('click', preventClick as EventListener, { capture: true, once: false });
        document.addEventListener('touchend', preventClick as EventListener, { capture: true, once: false });
        
        // Rimuovi i listener dopo un breve delay
        setTimeout(() => {
          document.removeEventListener('click', preventClick as EventListener, { capture: true });
          document.removeEventListener('touchend', preventClick as EventListener, { capture: true });
          justDraggedRef.current = false;
        }, 100);
      }
      // Note: click handling is done in onClick handler

      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };

    // Aggiungi listener touchmove con passive: false per permettere preventDefault durante il drag
    const touchMoveListener = (moveEvent: TouchEvent) => {
      handleTouchMove(moveEvent);
    };
    
    document.addEventListener('touchmove', touchMoveListener, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  };

  // Normal view
  // Calcola lo z-index: quando sta trascinando, usa la classe CSS (che ha z-index 1000)
  // Altrimenti usa lo z-index calcolato in base alla data di modifica/creazione
  const computedZIndex = isDragging 
    ? undefined // Usa la classe CSS .dragging che ha z-index: var(--z-index-dragging) = 1000
    : (postit.zIndex ?? 1); // Usa lo z-index calcolato o 1 come fallback

  const shouldAnimate = animationDelay !== undefined && !animationComplete;
  
  // Gestisce il completamento dell'animazione
  useEffect(() => {
    if (shouldAnimate && animationDelay !== undefined) {
      const timer = setTimeout(() => {
        setAnimationComplete(true);
      }, (animationDelay || 0) + 700); // Delay + durata animazione (0.7s)
      
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, animationDelay]);
  
  return (
    <div
      ref={containerRef}
      className={`${styles.postit} ${isDragging ? styles.dragging : ''} ${shouldAnimate ? styles.entering : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: computedZIndex,
        backgroundImage: `url(${baloonImageSrc})`,
        WebkitMaskImage: `url(${baloonImageSrc})`,
        maskImage: `url(${baloonImageSrc})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskMode: 'alpha',
        maskMode: 'alpha',
        pointerEvents: 'none', // Disabilita gli eventi sul container principale
        ...(shouldAnimate && { animationDelay: `${animationDelay}ms` }),
        ...safeAreaVars,
      } as CSSProperties}
      data-postit
    >
      {/* Wrapper per allineare il contenuto all'immagine di sfondo (che è contain) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          aspectRatio: `${viewBox.width} / ${viewBox.height}`,
          transform: 'translateY(-50%)',
          pointerEvents: 'none', // Lascia passare gli eventi
        }}
      >
        {/* SVG che gestisce gli eventi - l'area cliccabile corrisponde esattamente alla forma del balloon */}
        {baloonPath && (
          <svg
            className={styles.postitClickArea}
            viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none', // Disabilita di default sull'SVG
            }}
          >
            <path
              d={baloonPath}
              fill="white"
              opacity="0"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onClick={(e) => {
                // Stop propagation to prevent opening create modal
                e.stopPropagation();
                // Se c'è stato un drag recente, non fare nulla
                if (justDraggedRef.current) {
                  return;
                }
                // If this was a click (not a drag), call onClick handler
                if (wasClickedRef.current && !isDragging) {
                  onClick();
                  wasClickedRef.current = false;
                }
              }}
              style={{ 
                pointerEvents: 'fill', // Solo il fill del path è cliccabile - corrisponde esattamente alla forma
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            />
          </svg>
        )}
        <div className={styles.postitSafeArea}>
          <div className={styles.postitBody}>
            <h3 className={`${styles.title} ${geistMonoFont.className}`}>{postit.TITOLO}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoizza il componente per evitare re-render inutili
export default memo(Postit, (prevProps, nextProps) => {
  // Re-render solo se cambiano queste props critiche
  // Ritorna true se le props sono uguali (non serve re-render), false se sono diverse (serve re-render)
  const propsEqual = (
    prevProps.postit.id === nextProps.postit.id &&
    prevProps.postit.X === nextProps.postit.X &&
    prevProps.postit.Y === nextProps.postit.Y &&
    prevProps.postit.TITOLO === nextProps.postit.TITOLO &&
    prevProps.postit.zIndex === nextProps.postit.zIndex &&
    prevProps.postit.STILE === nextProps.postit.STILE &&
    prevProps.canvasTransform?.scale === nextProps.canvasTransform?.scale &&
    prevProps.canvasTransform?.translateX === nextProps.canvasTransform?.translateX &&
    prevProps.canvasTransform?.translateY === nextProps.canvasTransform?.translateY &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.onPositionUpdate === nextProps.onPositionUpdate &&
    prevProps.viewportToCanvas === nextProps.viewportToCanvas
  );
  
  // Se le props sono uguali, non serve re-render (ritorna true)
  // Se le props sono diverse, serve re-render (ritorna false)
  return propsEqual;
});
