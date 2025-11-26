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

const MIN_SCALE = 0.3;
const MAX_SCALE = 2;
const DEFAULT_SCALE = 1;
const ZOOM_STEP = 0.1;
const BOARD_BASE_SIZE = 2000; // Dimensione base della board (2000x2000px)
const BOARD_MARGIN = 40; // Margine fisso dai bordi (40px su ogni lato)

export function useCanvasTransform(): UseCanvasTransformReturn {
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: DEFAULT_SCALE,
    translateX: 0,
    translateY: 0,
  });

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; translateX: number; translateY: number } | null>(null);
  const transformRef = useRef(transform);

  // Keep ref in sync with state
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  // Convert viewport coordinates to canvas coordinates
  // Con il nuovo sistema, il container è centrato con translate(-50%, -50%)
  // quindi dobbiamo considerare il centro del container come origine
  const viewportToCanvas = useCallback(
    (x: number, y: number, containerWidth?: number, containerHeight?: number): { x: number; y: number } => {
      if (containerWidth !== undefined && containerHeight !== undefined) {
        // Il centro del container è a (containerWidth/2, containerHeight/2)
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        // Coordinate relative al centro
        const relativeX = x - centerX - transform.translateX;
        const relativeY = y - centerY - transform.translateY;
        // Converti in coordinate canvas (il centro della board è 1000, 1000)
        return {
          x: BOARD_BASE_SIZE / 2 + relativeX / transform.scale,
          y: BOARD_BASE_SIZE / 2 + relativeY / transform.scale,
        };
      }
      // Fallback al comportamento precedente
      return {
        x: (x - transform.translateX) / transform.scale,
        y: (y - transform.translateY) / transform.scale,
      };
    },
    [transform]
  );

  // Convert canvas coordinates to viewport coordinates
  const canvasToViewport = useCallback(
    (x: number, y: number, containerWidth?: number, containerHeight?: number): { x: number; y: number } => {
      if (containerWidth !== undefined && containerHeight !== undefined) {
        // Il centro del container è a (containerWidth/2, containerHeight/2)
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        // Coordinate relative al centro della board
        const relativeX = (x - BOARD_BASE_SIZE / 2) * transform.scale;
        const relativeY = (y - BOARD_BASE_SIZE / 2) * transform.scale;
        return {
          x: centerX + relativeX + transform.translateX,
          y: centerY + relativeY + transform.translateY,
        };
      }
      // Fallback al comportamento precedente
      return {
        x: x * transform.scale + transform.translateX,
        y: y * transform.scale + transform.translateY,
      };
    },
    [transform]
  );

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + ZOOM_STEP, MAX_SCALE),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - ZOOM_STEP, MIN_SCALE),
    }));
  }, []);

  const resetZoom = useCallback(() => {
    setTransform({
      scale: DEFAULT_SCALE,
      translateX: 0,
      translateY: 0,
    });
  }, []);

  const initializeTransform = useCallback(
    (containerWidth: number, containerHeight: number) => {
      // Calcola lo spazio disponibile considerando i margini fissi
      const availableWidth = containerWidth - BOARD_MARGIN * 2;
      const availableHeight = containerHeight - BOARD_MARGIN * 2;

      // Calcola lo zoom iniziale per far entrare la board nell'area disponibile
      const scaleX = availableWidth / BOARD_BASE_SIZE;
      const scaleY = availableHeight / BOARD_BASE_SIZE;
      const initialScale = Math.min(scaleX, scaleY, MAX_SCALE);

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
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, transform.scale + delta));

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
        const canvasX = BOARD_BASE_SIZE / 2 + relativeX / transform.scale;
        const canvasY = BOARD_BASE_SIZE / 2 + relativeY / transform.scale;

        // Calculate new translate to keep mouse point fixed
        const newRelativeX = (canvasX - BOARD_BASE_SIZE / 2) * newScale;
        const newRelativeY = (canvasY - BOARD_BASE_SIZE / 2) * newScale;
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

