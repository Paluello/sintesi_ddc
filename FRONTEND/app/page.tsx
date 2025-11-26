'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePostits } from '@/hooks/usePostits';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';
import CreateBaloonModal from '@/components/CreateBaloonModal';
import ModalOpenedBaloon from '@/components/ModalOpenedBaloon';
import TutorialModal from '@/components/TutorialModal';
import Postit from '@/components/Postit';
import Toolbar from '@/components/Toolbar';
import { Postit as PostitType, PostitCreateData } from '@/types/postit';
import { ensureAnonymousAuth } from '@/lib/auth';
import { TUTORIAL_STORAGE_KEY } from '@/components/tutorialConfig';
import styles from './page.module.css';

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostit, setSelectedPostit] = useState<PostitType | null>(null);
  const [openedBaloonModalOpen, setOpenedBaloonModalOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const { postits, loading, error, isOfflineMode, addPostit, updatePostitPosition } = usePostits();
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseDownRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mouseMovedRef = useRef(false);
  
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
      if (tutorialOpen || modalOpen || openedBaloonModalOpen) {
        return;
      }
      handleWheelZoom(e, container);
    };

    // Usa capture: true per intercettare l'evento prima degli altri listener
    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [handleWheelZoom, tutorialOpen, modalOpen, openedBaloonModalOpen]);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignora click se il tutorial è aperto, se si sta facendo pan o se un modal è aperto
    if (tutorialOpen || isPanning || modalOpen || openedBaloonModalOpen) {
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
    
    // Converti il centro della viewport in coordinate canvas
    const canvasCoords = viewportToCanvas(viewportCenterX, viewportCenterY, rect.width, rect.height);

    setClickPosition({ x: canvasCoords.x, y: canvasCoords.y });
    setModalOpen(true);
    
    // Reset
    mouseDownRef.current = null;
    mouseMovedRef.current = false;
  };

  const handleToolbarCreateClick = useCallback(() => {
    if (tutorialOpen || modalOpen || openedBaloonModalOpen) {
      return;
    }

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const viewportCenterX = rect.width / 2;
      const viewportCenterY = rect.height / 2;
      const canvasCoords = viewportToCanvas(viewportCenterX, viewportCenterY, rect.width, rect.height);
      setClickPosition({ x: canvasCoords.x, y: canvasCoords.y });
    } else {
      setClickPosition({ x: 100, y: 100 });
    }

    setModalOpen(true);
  }, [tutorialOpen, modalOpen, openedBaloonModalOpen, viewportToCanvas]);

  const handleToolbarHelpClick = useCallback(() => {
    setTutorialOpen(true);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Non fare pan se il tutorial è aperto o se un modal è aperto
    if (tutorialOpen || modalOpen || openedBaloonModalOpen) {
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
    if (tutorialOpen || modalOpen || openedBaloonModalOpen) {
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
    <div 
      ref={containerRef}
      className={`${styles.container} ${isPanning ? styles.panning : ''}`}
      onClick={handlePageClick}
      onMouseDown={handleCanvasMouseDown}
      onTouchStart={handleCanvasTouchStart}
    >
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {isOfflineMode && (
        <div className={styles.offlineBanner}>
          ⚠️ Modalità offline: stai visualizzando post-it di esempio. La connessione al server non è disponibile.
        </div>
      )}

      {error && !isOfflineMode && (
        <div className={styles.error}>
          {error.message}
        </div>
      )}

      {!loading && (
        <>
          <div 
            ref={canvasRef}
            className={styles.postitsContainer} 
            data-postits-container
            style={{
              transform: `translate(calc(-50% + ${transform.translateX}px), calc(-50% + ${transform.translateY}px)) scale(${transform.scale})`,
            }}
          >
            {postits.map((postit) => (
              <Postit
                key={postit.id}
                postit={postit}
                onClick={() => handlePostitClick(postit)}
                onPositionUpdate={handlePositionUpdate}
                canvasTransform={transform}
                viewportToCanvas={viewportToCanvas}
              />
            ))}
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
        onClose={() => setTutorialOpen(false)}
        onComplete={() => setTutorialOpen(false)}
      />

      {!modalOpen && !openedBaloonModalOpen && !tutorialOpen && (
        <Toolbar
          onPlusClick={handleToolbarCreateClick}
          onQuestionmarkClick={handleToolbarHelpClick}
        />
      )}
    </div>
  );
}
