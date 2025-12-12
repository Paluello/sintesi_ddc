'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePostits } from '@/hooks/usePostits';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';
import { useRandomBackground } from '@/hooks/useRandomBackground';
import CreateBaloonModal from '@/components/organisms/CreateBaloonModal/CreateBaloonModal';
import ModalOpenedBaloon from '@/components/organisms/ModalOpenedBaloon/ModalOpenedBaloon';
import TutorialModal from '@/components/organisms/TutorialModal/TutorialModal';
import LoadingScreen from '@/components/organisms/LoadingScreen/LoadingScreen';
import Postit from '@/components/organisms/Postit/Postit';
import Toolbar from '@/components/molecules/Toolbar/Toolbar';
import SideMenu from '@/components/organisms/SideMenu/SideMenu';
import { Postit as PostitType, PostitCreateData } from '@/types/postit';
import { ensureAnonymousAuth } from '@/lib/auth';
import { TUTORIAL_STORAGE_KEY } from '@/components/organisms/TutorialModal/tutorialConfig';
import { useLoadingScreen } from '@/components/providers/LoadingScreenProvider';
import styles from './page.module.css';

export default function SpazioDigitalePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostit, setSelectedPostit] = useState<PostitType | null>(null);
  const [openedBaloonModalOpen, setOpenedBaloonModalOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [initialPostitIds, setInitialPostitIds] = useState<Set<number> | null>(null);
  const { postits, loading, error, isOfflineMode, addPostit, updatePostitPosition } = usePostits();
  const { setIsVisible: setLoadingScreenVisible } = useLoadingScreen();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseDownRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mouseMovedRef = useRef(false);
  const loadingStartTimeRef = useRef<number | null>(null);
  const backgroundColor = useRandomBackground();
  
  const {
    transform,
    handleWheel: handleWheelZoom,
    startPan,
    isPanning,
    viewportToCanvas,
    initializeTransform,
  } = useCanvasTransform();

  // Controlla se il tutorial è già stato visto al mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!tutorialSeen) {
        setTutorialOpen(true);
      }
    }
  }, []);

  // Inizializza autenticazione anonima al mount (continua in background anche con tutorial aperto)
  useEffect(() => {
    ensureAnonymousAuth().then(() => {
      setAuthReady(true);
    });
  }, []);

  // Mostra il LoadingScreen solo se il caricamento sta effettivamente impiegando tempo
  // (più di 500ms) per evitare flash durante la navigazione normale
  useEffect(() => {
    if (loading && loadingStartTimeRef.current === null) {
      // Inizia a tracciare il tempo di caricamento
      loadingStartTimeRef.current = Date.now();
      
      // Mostra il LoadingScreen solo se il caricamento dura più di 500ms
      const timer = setTimeout(() => {
        // Verifica ancora se stiamo caricando (potrebbe essere già completato)
        // Usa una funzione di callback per accedere allo stato corrente
        setShowLoadingScreen((prev) => {
          // Se il caricamento è ancora in corso, mostra il LoadingScreen
          if (loading) {
            return true;
          }
          return prev;
        });
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (!loading && loadingStartTimeRef.current !== null) {
      // Reset quando il caricamento è completato
      loadingStartTimeRef.current = null;
      // Chiudi il LoadingScreen se era visibile
      setShowLoadingScreen(false);
    }
  }, [loading]);

  // Determina lo stato della connessione al server per il LoadingScreen
  // null = ancora in controllo, true = connesso, false = non connesso
  const serverConnectionStatus = (() => {
    if (loading) return null; // Ancora in controllo
    if (isOfflineMode) return false; // Server non connesso
    return true; // Server connesso
  })();

  // Sincronizza lo stato del LoadingScreen con il context
  useEffect(() => {
    setLoadingScreenVisible(showLoadingScreen);
  }, [showLoadingScreen, setLoadingScreenVisible]);

  // Traccia gli ID dei postit presenti al primo render dopo il loading screen
  useEffect(() => {
    if (!showLoadingScreen && !loading && initialPostitIds === null) {
      // Primo render dopo il loading screen: salva gli ID dei postit presenti
      setInitialPostitIds(new Set(postits.map(p => p.id)));
    }
  }, [showLoadingScreen, loading, postits, initialPostitIds]);


  // Inizializza la board centrata al mount e al resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimeoutId: NodeJS.Timeout | null = null;

    const initializeBoard = () => {
      // Usa clientWidth/clientHeight che sono più affidabili per il layout
      // e non includono scrollbar o altri elementi
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Assicurati che abbiamo dimensioni valide
      if (width > 0 && height > 0) {
        initializeTransform(width, height);
      }
    };

    // Inizializza al mount con un piccolo delay per assicurarsi che il DOM sia completamente renderizzato
    const timeoutId = setTimeout(() => {
      initializeBoard();
    }, 0);

    // Gestisci il resize della finestra per ri-centrare la board
    const handleResize = () => {
      // Usa un debounce per evitare calcoli multipli rapidi durante il resize
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
      }
      resizeTimeoutId = setTimeout(() => {
        initializeBoard();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [initializeTransform]);

  // Registra manualmente l'event listener wheel con { passive: false }
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Disabilita zoom se il tutorial è aperto o se un modal è aperto
      if (tutorialOpen || modalOpen || openedBaloonModalOpen || menuOpen) {
        return;
      }
      handleWheelZoom(e, container);
    };

    // Usa capture: true per intercettare l'evento prima degli altri listener
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [handleWheelZoom, tutorialOpen, modalOpen, openedBaloonModalOpen, menuOpen]);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignora click se il tutorial è aperto, se si sta facendo pan o se un modal è aperto
    if (tutorialOpen || isPanning || modalOpen || openedBaloonModalOpen || menuOpen) {
      return;
    }
    
    // Ignora click sui postit
    if ((e.target as HTMLElement).closest('[data-postit]')) {
      return;
    }
    // Ignora click sul modale opened baloon
    if ((e.target as HTMLElement).closest('[data-opened-baloon-modal]')) {
      return;
    }
    // Ignora click sul modal
    if ((e.target as HTMLElement).closest('[data-modal]')) {
      return;
    }
    // Ignora click sulla toolbar
    if ((e.target as HTMLElement).closest('[data-toolbar]')) {
      return;
    }

    // Se c'è stato movimento del mouse durante il click, non aprire il modale (era un drag)
    if (mouseMovedRef.current) {
      mouseMovedRef.current = false;
      mouseDownRef.current = null;
      return;
    }

    // Calcola il centro della viewport
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const viewportCenterX = rect.width / 2;
    const viewportCenterY = rect.height / 2;
    
    // Calcola la posizione del mouse relativa al container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Se il click è vicino al centro (entro 50px), usa sempre (0, 0) nel canvas
    // indipendentemente dal transform corrente
    const distanceFromCenter = Math.sqrt(
      Math.pow(mouseX - viewportCenterX, 2) + Math.pow(mouseY - viewportCenterY, 2)
    );
    
    let canvasCoords;
    if (distanceFromCenter < 50) {
      // Click al centro: usa sempre (0, 0) nel canvas
      canvasCoords = { x: 0, y: 0 };
    } else {
      // Click altrove: calcola le coordinate canvas del punto cliccato
      canvasCoords = viewportToCanvas(mouseX, mouseY, rect.width, rect.height);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[handlePageClick] Debug coordinate:', {
        mousePos: { x: mouseX, y: mouseY },
        viewportCenter: { x: viewportCenterX, y: viewportCenterY },
        distanceFromCenter,
        canvasCoords,
        containerSize: { width: rect.width, height: rect.height },
        transform,
      });
    }

    setClickPosition({ x: canvasCoords.x, y: canvasCoords.y });
    setModalOpen(true);
    
    // Reset
    mouseDownRef.current = null;
    mouseMovedRef.current = false;
  };

  const handleToolbarCreateClick = useCallback(() => {
    if (tutorialOpen || modalOpen || openedBaloonModalOpen || menuOpen) {
      return;
    }

    // Quando si crea un postit dalla toolbar, usa sempre (0, 0) nel canvas
    // indipendentemente dal transform corrente
    setClickPosition({ x: 0, y: 0 });
    setModalOpen(true);
  }, [tutorialOpen, modalOpen, openedBaloonModalOpen, menuOpen]);

  const handleToolbarHelpClick = useCallback(() => {
    setTutorialOpen(true);
  }, []);

  const handleToolbarMenuClick = useCallback(() => {
    setMenuOpen(prev => !prev);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Non fare pan se il tutorial è aperto o se un modal è aperto
    if (tutorialOpen || modalOpen || openedBaloonModalOpen || menuOpen) {
      return;
    }
    
    // Se si clicca su un post-it o altri elementi interattivi, non fare pan
    if ((e.target as HTMLElement).closest('[data-postit]')) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-modal]')) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-opened-baloon-modal]')) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-toolbar]')) {
      return;
    }
    
    // Traccia la posizione iniziale del mouse per distinguere click da drag
    mouseDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    mouseMovedRef.current = false;
    
    // Traccia il movimento del mouse
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (mouseDownRef.current) {
        const deltaX = Math.abs(moveEvent.clientX - mouseDownRef.current.x);
        const deltaY = Math.abs(moveEvent.clientY - mouseDownRef.current.y);
        // Se il mouse si è mosso di più di 5px, considera come movimento
        if (deltaX > 5 || deltaY > 5) {
          mouseMovedRef.current = true;
        }
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Altrimenti, inizia pan
    startPan(e);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Non fare pan se il tutorial è aperto o se un modal è aperto
    if (tutorialOpen || modalOpen || openedBaloonModalOpen || menuOpen) {
      return;
    }
    
    // Se si tocca un post-it o altri elementi interattivi, non fare pan
    if ((e.target as HTMLElement).closest('[data-postit]')) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-modal]')) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-opened-baloon-modal]')) {
      return;
    }
    if ((e.target as HTMLElement).closest('[data-toolbar]')) {
      return;
    }
    
    // Altrimenti, inizia pan
    startPan(e);
  };

  const handlePostitClick = useCallback((postit: PostitType) => {
    setSelectedPostit(postit);
    setOpenedBaloonModalOpen(true);
  }, []);

  const handleCloseOpenedBaloon = useCallback(() => {
    setOpenedBaloonModalOpen(false);
    setSelectedPostit(null);
  }, []);

  const handleCreatePostit = useCallback(async (data: PostitCreateData) => {
    const position = clickPosition || { x: 100, y: 100 };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[handleCreatePostit] Creazione postit con coordinate:', {
        position,
        clickPosition,
      });
    }
    
    await addPostit({
      ...data,
      X: position.x,
      Y: position.y,
    });
    setClickPosition(null);
  }, [addPostit, clickPosition]);

  const handlePositionUpdate = useCallback(async (id: number, x: number, y: number) => {
    try {
      await updatePostitPosition(id, x, y);
    } catch (error) {
      console.error('Errore nell\'aggiornamento della posizione:', error);
      // Ricarica i postit per sincronizzare lo stato
      // Potresti voler aggiungere un refetch qui se necessario
    }
  }, [updatePostitPosition]);

  if (!authReady) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <>
      {showLoadingScreen && (
        <LoadingScreen
          isServerConnected={serverConnectionStatus}
          backgroundColor={backgroundColor}
          onComplete={() => {
            // Il LoadingScreen si chiude automaticamente quando il caricamento è completato
            // Questo callback viene chiamato quando l'animazione è finita
          }}
        />
      )}
      <div 
        ref={containerRef}
        className={`${styles.container} ${isPanning ? styles.panning : ''}`}
        style={{ backgroundColor }}
        onClick={handlePageClick}
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
      >
        {error && !isOfflineMode && !showLoadingScreen && (
          <div className={styles.error}>
            {error.message}
          </div>
        )}

        {!loading && !showLoadingScreen && (
          <>
            <div 
              ref={canvasRef}
              className={styles.postitsContainer} 
              data-postits-container
              style={{
                transform: `translate(calc(-50% + ${transform.translateX}px), calc(-50% + ${transform.translateY}px)) scale(${transform.scale})`,
              }}
            >
              {/* Titolo mobile - assoluto sullo sfondo della board */}
              <div className={styles.titleMobile}>
                <img 
                  src="/images/testo_titolo.svg" 
                  alt="Titolo" 
                  className={styles.titleImage}
                />
              </div>

              {/* Titolo desktop - assoluto sullo sfondo della board */}
              <div className={styles.titleDesktop}>
                <img 
                  src="/images/testo_titolo.svg" 
                  alt="Titolo" 
                  className={styles.titleImage}
                />
              </div>

              {postits.map((postit, index) => {
                // Applica l'animazione solo ai postit presenti al primo render dopo il loading screen
                const shouldAnimate = initialPostitIds !== null && initialPostitIds.has(postit.id);
                const initialPostitsArray = initialPostitIds ? Array.from(initialPostitIds) : [];
                const initialIndex = shouldAnimate ? initialPostitsArray.indexOf(postit.id) : -1;
                
                return (
                  <Postit
                    key={postit.id}
                    postit={postit}
                    onClick={() => handlePostitClick(postit)}
                    onPositionUpdate={handlePositionUpdate}
                    canvasTransform={transform}
                    viewportToCanvas={viewportToCanvas}
                    animationDelay={shouldAnimate ? initialIndex * 150 : undefined}
                    backgroundColor={backgroundColor}
                  />
                );
              })}
            </div>
          </>
        )}

        <div data-modal>
          <CreateBaloonModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setClickPosition(null);
            }}
            onSubmit={handleCreatePostit}
          />
        </div>

        <div data-opened-baloon-modal>
          <ModalOpenedBaloon
            open={openedBaloonModalOpen}
            onClose={handleCloseOpenedBaloon}
            postit={selectedPostit}
          />
        </div>

        <TutorialModal
          open={tutorialOpen}
          onClose={() => {
            setTutorialOpen(false);
            // Salva nel localStorage che il tutorial è stato visto
            if (typeof window !== 'undefined') {
              localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
            }
          }}
          onComplete={() => {
            setTutorialOpen(false);
            // Salva nel localStorage che il tutorial è stato visto
            if (typeof window !== 'undefined') {
              localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
            }
          }}
        />

        <SideMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

        {!modalOpen && !openedBaloonModalOpen && !tutorialOpen && (
          <Toolbar
            onPlusClick={handleToolbarCreateClick}
            onQuestionmarkClick={handleToolbarHelpClick}
            onMenuClick={handleToolbarMenuClick}
            isMenuOpen={menuOpen}
          />
        )}

      </div>
    </>
  );
}
