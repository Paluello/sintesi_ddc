import { useState, useRef, useCallback, useEffect } from 'react';

interface CanvasTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

interface UseCanvasTransformReturn {
  transform: CanvasTransform;
  setTransform: (transform: CanvasTransform) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  initializeTransform: (containerWidth: number, containerHeight: number) => void;
  handleWheel: (e: WheelEvent, container: HTMLElement) => void;
  startPan: (e: React.MouseEvent | React.TouchEvent) => void;
  isPanning: boolean;
  viewportToCanvas: (x: number, y: number) => { x: number; y: number };
  canvasToViewport: (x: number, y: number) => { x: number; y: number };
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const DEFAULT_SCALE = 0.8;
const ZOOM_STEP = 0.05;
const BOARD_MARGIN = 20; // Margine per evitare che la board tocchi i bordi

export function useCanvasTransform(): UseCanvasTransformReturn {
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: DEFAULT_SCALE,
    translateX: 0,
    translateY: 0,
  });

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; translateX: number; translateY: number } | null>(null);
  const transformRef = useRef(transform);
  const initialScaleRef = useRef<number | null>(null); // Salva lo scale iniziale

  // Keep ref in sync with state
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Convert viewport coordinates to canvas coordinates
  // Con il nuovo sistema, il centro del viewport corrisponde a (0, 0) nel canvas
  // Il container è centrato con CSS translate(-50%, -50%)
  const viewportToCanvas = useCallback(
    (x: number, y: number, containerWidth?: number, containerHeight?: number): { x: number; y: number } => {
      if (containerWidth !== undefined && containerHeight !== undefined) {
        // Il centro del container è a (containerWidth/2, containerHeight/2)
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        // Coordinate relative al centro del viewport
        const relativeX = x - centerX - transform.translateX;
        const relativeY = y - centerY - transform.translateY;
        // Converti in coordinate canvas: il centro (0, 0) corrisponde al centro del viewport
        return {
          x: relativeX / transform.scale,
          y: relativeY / transform.scale,
        };
      }
      // Fallback: assumiamo che x, y siano già relativi al centro
      return {
        x: (x - transform.translateX) / transform.scale,
        y: (y - transform.translateY) / transform.scale,
      };
    },
    [transform]
  );

  // Convert canvas coordinates to viewport coordinates
  // Con il nuovo sistema, il centro del canvas (0, 0) corrisponde al centro del viewport
  const canvasToViewport = useCallback(
    (x: number, y: number, containerWidth?: number, containerHeight?: number): { x: number; y: number } => {
      if (containerWidth !== undefined && containerHeight !== undefined) {
        // Il centro del container è a (containerWidth/2, containerHeight/2)
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        // Converti coordinate canvas in coordinate relative al centro
        const relativeX = x * transform.scale;
        const relativeY = y * transform.scale;
        // Posizione nel viewport: centro + offset relativo + translate
        return {
          x: centerX + relativeX + transform.translateX,
          y: centerY + relativeY + transform.translateY,
        };
      }
      // Fallback: assumiamo che x, y siano già relativi al centro
      return {
        x: x * transform.scale + transform.translateX,
        y: y * transform.scale + transform.translateY,
      };
    },
    [transform]
  );

  const zoomIn = useCallback(() => {
    setTransform((prev) => {
      // Usa lo scale iniziale come limite massimo, se disponibile
      const maxScale = initialScaleRef.current ?? MAX_SCALE;
      return {
        ...prev,
        scale: Math.min(prev.scale + ZOOM_STEP, maxScale),
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - ZOOM_STEP, MIN_SCALE),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    // Resetta allo scale iniziale se disponibile, altrimenti usa DEFAULT_SCALE
    const resetScale = initialScaleRef.current ?? DEFAULT_SCALE;
    setTransform({
      scale: resetScale,
      translateX: 0,
      translateY: 0,
    });
  }, []);

  const initializeTransform = useCallback(
    (containerWidth: number, containerHeight: number) => {
      // Calcola lo spazio disponibile considerando i margini
      const availableWidth = containerWidth - BOARD_MARGIN * 2;
      const availableHeight = containerHeight - BOARD_MARGIN * 2;

      // Calcola uno scale iniziale basato sulle dimensioni del viewport
      // Usa una dimensione di riferimento di 2000px (come prima con BOARD_BASE_SIZE)
      // per mantenere lo stesso comportamento dello zoom iniziale
      const referenceSize = 2000; // Dimensione di riferimento per il calcolo dello scale
      const scaleX = availableWidth / referenceSize;
      const scaleY = availableHeight / referenceSize;
      const initialScale = Math.min(scaleX, scaleY, MAX_SCALE);

      // Salva lo scale iniziale come limite massimo per lo zoom in
      initialScaleRef.current = initialScale;

      // Con il nuovo sistema CSS, la board è già centrata con translate(-50%, -50%)
      // Quindi non serve translateX/Y iniziale, solo lo scale
      setTransform({
        scale: initialScale,
        translateX: 0,
        translateY: 0,
      });
    },
    []
  );

  const handleWheel = useCallback(
    (e: WheelEvent, container: HTMLElement) => {
      // Zoom with Ctrl/Cmd + wheel, or just wheel
      const isZoomModifier = e.ctrlKey || e.metaKey;
      
      if (isZoomModifier || true) { // Allow zoom with just wheel
        // Only prevent default if the event is cancelable
        if (e.cancelable) {
          e.preventDefault();
        }
        e.stopPropagation();

        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        // Usa lo scale iniziale come limite massimo, se disponibile
        const maxScale = initialScaleRef.current ?? MAX_SCALE;
        const newScale = Math.max(MIN_SCALE, Math.min(maxScale, transform.scale + delta));

        // Zoom towards mouse position
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        // Convert mouse position to canvas coordinates before zoom
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const relativeX = mouseX - centerX - transform.translateX;
        const relativeY = mouseY - centerY - transform.translateY;
        // Con il nuovo sistema, il centro è (0, 0)
        const canvasX = relativeX / transform.scale;
        const canvasY = relativeY / transform.scale;

        // Calculate new translate to keep mouse point fixed
        const newRelativeX = canvasX * newScale;
        const newRelativeY = canvasY * newScale;
        const newTranslateX = mouseX - centerX - newRelativeX;
        const newTranslateY = mouseY - centerY - newRelativeY;

        setTransform({
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY,
        });
      }
    },
    [transform]
  );

  const startPan = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (e.type === 'mousedown' && (e as React.MouseEvent).button !== 0) {
        return; // Only handle left mouse button
      }

      e.preventDefault();
      e.stopPropagation();

      const isTouch = 'touches' in e;
      const clientX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = isTouch ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const currentTransform = transformRef.current;
      panStartRef.current = {
        x: clientX,
        y: clientY,
        translateX: currentTransform.translateX,
        translateY: currentTransform.translateY,
      };

      setIsPanning(true);

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        const panStart = panStartRef.current;
        if (!panStart) return;

        const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0]?.clientX : (moveEvent as MouseEvent).clientX;
        const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0]?.clientY : (moveEvent as MouseEvent).clientY;

        if (moveClientX === undefined || moveClientY === undefined) return;

        const deltaX = moveClientX - panStart.x;
        const deltaY = moveClientY - panStart.y;

        setTransform((prev) => ({
          ...prev,
          translateX: panStart.translateX + deltaX,
          translateY: panStart.translateY + deltaY,
        }));
      };

      const handleEnd = () => {
        setIsPanning(false);
        panStartRef.current = null;
        document.removeEventListener('mousemove', handleMove as EventListener);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove as EventListener);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);
      };

      document.addEventListener('mousemove', handleMove as EventListener);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('touchcancel', handleEnd);
    },
    []
  );

  return {
    transform,
    setTransform,
    zoomIn,
    zoomOut,
    resetZoom,
    initializeTransform,
    handleWheel,
    startPan,
    isPanning,
    viewportToCanvas,
    canvasToViewport,
  };
}

