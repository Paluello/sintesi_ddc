'use client';

import { CSSProperties, ReactNode, useEffect, useState, useMemo, useRef } from 'react';
import styles from './BaseModal.module.css';
import { loadSafeAreaFromSVG, extractSafeAreaFromSVGString, loadPathFromSVG, type SafeArea, type ViewBox } from '@/lib/svgSafeArea';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  imageSlot?: ReactNode;
  safeAreaStyle?: CSSProperties;
  imageClassName?: string;
  contentClassName?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  disableOverlayClose?: boolean;
  hideCloseButton?: boolean;
  hideOverlay?: boolean;
  hideImage?: boolean;
  wrapperClassName?: string;
  surfaceClassName?: string;
  svgPath?: string; // Path opzionale all'SVG da cui caricare la safe area
  relativeClose?: boolean; // Se true, il pulsante di chiusura è relativo al layout
  svgFillColor?: string; // Colore del fill dell'SVG (default: #000 nero)
  maxWidth?: string; // Larghezza massima del modal (default: 'min(92vw, 560px)')
  overlayAlignItems?: 'center' | 'flex-start' | 'flex-end'; // Allineamento verticale dell'overlay
}

const EXIT_ANIMATION_MS = 300;

// Path di default per l'SVG del modal
const DEFAULT_MODAL_SVG_PATH = '/images/rettangoli/basemodale.svg';

// Safe area di fallback (valori di default)
const FALLBACK_SAFE_AREA: SafeArea = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
};

// Cache globale per le safe areas caricate (condivisa tra tutte le istanze)
let loadedSafeAreas: Record<string, SafeArea> = {};
let loadingPromises: Record<string, Promise<SafeArea | null>> = {};

// Cache globale per i path SVG caricati
let loadedSvgPaths: Record<string, { path: string; viewBox: ViewBox }> = {};
let loadingSvgPathPromises: Record<string, Promise<{ path: string; viewBox: ViewBox } | null>> = {};

// SVG di fallback (quello hardcoded originale)
const FALLBACK_SVG = {
  path: 'M219.5,6.1l8.7,271.6-20.9-.2c-57.6-2.6-118-2.3-176.4-4.2-8.8-.3-17.6.6-26.1-2.2,1.5-14.6,0-29.5.8-44.1.1-2-2.5-2.2,1.2-3.3-2.2-2.6-3-8.9-2.8-12.3,3.8-60.7.3-123.1,2.9-184.5.3-7.5-4-8.4,8-10.1,4.6-.7,10.7.2,14.8-.1,41-3.2,83.6-5.8,125.3-8.4,8.8-.5,61.7-6.7,64.6-2.1h0Z',
  viewBox: { x: 0, y: 0, width: 231.1, height: 291.6 },
};

export default function BaseModal({
  open,
  onClose,
  children,
  imageSlot,
  safeAreaStyle,
  imageClassName,
  contentClassName,
  ariaDescribedBy,
  ariaLabelledBy,
  disableOverlayClose = false,
  hideCloseButton = false,
  hideOverlay = false,
  hideImage = false,
  wrapperClassName,
  surfaceClassName,
  svgPath = DEFAULT_MODAL_SVG_PATH, // Usa il path di default se non viene passato
  relativeClose = false,
  svgFillColor = '#000', // Default nero
  maxWidth = 'min(92vw, 560px)', // Default
  overlayAlignItems = 'center', // Default centrato
}: BaseModalProps) {
  const [isVisible, setIsVisible] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  // Inizializza sempre con fallback, poi carica nel useEffect
  const [safeArea, setSafeArea] = useState<SafeArea>(FALLBACK_SAFE_AREA);
  const [svgPathData, setSvgPathData] = useState<{ path: string; viewBox: ViewBox }>(FALLBACK_SVG);
  const safeAreaRef = useRef<HTMLDivElement>(null);
  const modalSurfaceRef = useRef<HTMLDivElement>(null);

  // Carica la safe area e il path SVG dall'SVG (usa sempre il path, anche quello di default)
  useEffect(() => {
    if (svgPath) {
      // Carica la safe area
      // Se è già in cache, usa quella
      if (loadedSafeAreas[svgPath]) {
        console.log('BaseModal: Safe area dalla cache per', svgPath, loadedSafeAreas[svgPath]);
        setSafeArea(loadedSafeAreas[svgPath]);
      } else {
        // Se c'è già un caricamento in corso per questo path, aspetta quello
        if (svgPath in loadingPromises) {
          loadingPromises[svgPath].then((area) => {
            if (area) {
              loadedSafeAreas[svgPath] = area;
              setSafeArea(area);
            } else {
              setSafeArea(FALLBACK_SAFE_AREA);
            }
          }).catch(() => {
            setSafeArea(FALLBACK_SAFE_AREA);
          });
        } else {
          // Altrimenti, inizia il caricamento
          loadingPromises[svgPath] = loadSafeAreaFromSVG(svgPath);
          loadingPromises[svgPath].then((area) => {
            if (area) {
              loadedSafeAreas[svgPath] = area;
              setSafeArea(area);
              console.log('BaseModal: Safe area caricata da', svgPath, area);
            } else {
              console.warn('BaseModal: Safe area non trovata in', svgPath, ', uso fallback');
              setSafeArea(FALLBACK_SAFE_AREA);
            }
            delete loadingPromises[svgPath];
          }).catch((error) => {
            console.error('BaseModal: Errore nel caricamento della safe area da', svgPath, error);
            setSafeArea(FALLBACK_SAFE_AREA);
            delete loadingPromises[svgPath];
          });
        }
      }

      // Carica il path SVG per lo sfondo
      // Se è già in cache, usa quello
      if (loadedSvgPaths[svgPath]) {
        console.log('BaseModal: SVG path dalla cache per', svgPath);
        setSvgPathData(loadedSvgPaths[svgPath]);
      } else {
        // Se c'è già un caricamento in corso per questo path, aspetta quello
        if (svgPath in loadingSvgPathPromises) {
          loadingSvgPathPromises[svgPath].then((data) => {
            if (data) {
              loadedSvgPaths[svgPath] = data;
              setSvgPathData(data);
            } else {
              console.warn('BaseModal: SVG path non trovato in', svgPath, ', uso fallback');
              setSvgPathData(FALLBACK_SVG);
            }
          }).catch(() => {
            setSvgPathData(FALLBACK_SVG);
          });
        } else {
          // Altrimenti, inizia il caricamento
          loadingSvgPathPromises[svgPath] = loadPathFromSVG(svgPath);
          loadingSvgPathPromises[svgPath].then((data) => {
            if (data) {
              loadedSvgPaths[svgPath] = data;
              setSvgPathData(data);
              console.log('BaseModal: SVG path caricato da', svgPath);
            } else {
              console.warn('BaseModal: SVG path non trovato in', svgPath, ', uso fallback');
              setSvgPathData(FALLBACK_SVG);
            }
            delete loadingSvgPathPromises[svgPath];
          }).catch((error) => {
            console.error('BaseModal: Errore nel caricamento del path SVG da', svgPath, error);
            setSvgPathData(FALLBACK_SVG);
            delete loadingSvgPathPromises[svgPath];
          });
        }
      }
      return;
    }

    // Se non c'è svgPath (non dovrebbe mai succedere perché abbiamo un default), usa fallback
    setSafeArea(FALLBACK_SAFE_AREA);
    setSvgPathData(FALLBACK_SVG);
  }, [svgPath]);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }

    if (isVisible) {
      setIsClosing(true);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, EXIT_ANIMATION_MS);

      return () => clearTimeout(timeout);
    }
  }, [open, isVisible]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Adatta l'altezza del modalSurface e il padding-bottom della safe area
  useEffect(() => {
    if (!isVisible || !safeAreaRef.current || !modalSurfaceRef.current) return;

    const updateLayout = () => {
      const safeAreaElement = safeAreaRef.current;
      const modalSurfaceElement = modalSurfaceRef.current;
      if (!safeAreaElement || !modalSurfaceElement) return;

      // Somma l'altezza di tutti i figli (incluso il pulsante di chiusura) e i loro margini verticali
      const childElements = Array.from(safeAreaElement.children) as HTMLElement[];
      const totalChildrenHeight = childElements.reduce((sum, child) => {
        const style = window.getComputedStyle(child);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        return sum + child.offsetHeight + marginTop + marginBottom;
      }, 0);
      
      const gap = parseFloat(getComputedStyle(safeAreaElement).gap) || 0;
      const totalGapHeight = gap * Math.max(childElements.length - 1, 0);
      const totalContentHeight = totalChildrenHeight + totalGapHeight;
      
      // Calcola l'altezza necessaria del modalSurface
      // La safe area ha top come percentuale dell'altezza del modalSurface
      // e padding-bottom che vogliamo sia anche percentuale dell'altezza del modalSurface
      // 
      // Se top = t%, padding-bottom = p%, e contenuto = h
      // allora: altezza_modal = (h) / (1 - t% - p%)
      const topPercent = safeArea.top / 100;
      const bottomPercent = safeArea.bottom / 100;
      const denominator = 1 - topPercent - bottomPercent;
      
      let calculatedHeight = 200; // altezza minima
      if (denominator > 0.01) { // evita divisione per zero
        calculatedHeight = totalContentHeight / denominator;
      } else {
        // Fallback: aggiungi offset stimati
        calculatedHeight = totalContentHeight + 100;
      }
      
      // Imposta l'altezza del modalSurface
      modalSurfaceElement.style.height = `${Math.max(calculatedHeight, 200)}px`;
      
      // Padding-bottom rimosso - non viene più calcolato dinamicamente
    };

    // Aggiorna immediatamente dopo un breve delay per permettere il rendering
    const timeoutId = setTimeout(() => {
      updateLayout();
    }, 0);

    // Aggiorna quando il contenuto cambia (usando ResizeObserver)
    const resizeObserver = new ResizeObserver(() => {
      updateLayout();
    });

    resizeObserver.observe(safeAreaRef.current);
    
    // Osserva anche il contentArea se presente
    const childElements = Array.from(safeAreaRef.current.children) as HTMLElement[];
    childElements.forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isVisible, children, safeArea, styles.contentArea, styles.imageArea]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!disableOverlayClose && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Usa la safe area caricata (dovrebbe sempre avere un valore)
  // IMPORTANTE: Tutti gli hook devono essere chiamati prima di qualsiasi return condizionale
  const resolvedSafeArea = useMemo(() => {
    return safeArea;
  }, [safeArea]);

  // Calcola le variabili CSS per la safe area
  // Nota: padding-bottom deve essere calcolato dinamicamente perché CSS padding-bottom% è relativo alla larghezza, non all'altezza
  const safeAreaVars: CSSProperties = useMemo(() => {
    const baseVars: CSSProperties = {
      '--base-modal-safe-inset-top': `${resolvedSafeArea.top}%`,
      '--base-modal-safe-inset-right': `${resolvedSafeArea.right}%`,
      '--base-modal-safe-inset-left': `${resolvedSafeArea.left}%`,
      ...safeAreaStyle,
    } as CSSProperties;
    // padding-bottom sarà calcolato dinamicamente nel useEffect
    return baseVars;
  }, [resolvedSafeArea, safeAreaStyle]);

  if (!isVisible) {
    return null;
  }

  const imageClasses = [styles.imageArea, imageClassName].filter(Boolean).join(' ');
  const contentClasses = [styles.contentArea, contentClassName].filter(Boolean).join(' ');
  const overlayClasses = [
    styles.overlay,
    hideOverlay ? styles.overlayHidden : '',
    isClosing ? styles.overlayClosing : styles.overlayOpening,
  ]
    .filter(Boolean)
    .join(' ');
  const wrapperClasses = [
    styles.modalWrapper,
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const modalClasses = [
    styles.modalSurface,
    surfaceClassName,
    isClosing ? styles.modalSurfaceClosing : styles.modalSurfaceOpening,
  ]
    .filter(Boolean)
    .join(' ');

  const modalContent = (
    <div className={modalClasses} ref={modalSurfaceRef} style={{ width: maxWidth }}>
      <svg
        className={styles.modalSvg}
        viewBox={`${svgPathData.viewBox.x} ${svgPathData.viewBox.y} ${svgPathData.viewBox.width} ${svgPathData.viewBox.height}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d={svgPathData.path} fill={svgFillColor}/>
      </svg>
      <div className={styles.safeArea} style={safeAreaVars} ref={safeAreaRef}>
        {!hideCloseButton && (
          <button
            type="button"
            className={`${styles.closeButton} ${relativeClose ? styles.closeButtonRelative : ''}`}
            aria-label="Chiudi modale"
            onClick={onClose}
          />
        )}
        {!hideImage && (
          <div className={imageClasses}>
            {imageSlot ?? <span className={styles.imagePlaceholder}>Placeholder immagine</span>}
          </div>
        )}
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );

  // Se hideOverlay è true, renderizza solo il modalSurface senza l'overlay
  // Questo permette di avere più modali nello stesso overlay
  if (hideOverlay) {
    return (
      <div className={wrapperClasses}>
        {modalContent}
      </div>
    );
  }

  // Comportamento normale con overlay
  return (
    <div
      className={overlayClasses}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      style={{ alignItems: overlayAlignItems }}
    >
      <div className={wrapperClasses}>
        {modalContent}
      </div>
    </div>
  );
}

