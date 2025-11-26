/**
 * Utility per estrarre le safe areas dagli SVG dei balloon
 */

export type SafeArea = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type ViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SafeAreaRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Parsea il viewBox da una stringa SVG
 */
function parseViewBox(viewBoxString: string | null): ViewBox | null {
  if (!viewBoxString) return null;
  
  const parts = viewBoxString.trim().split(/\s+/);
  if (parts.length !== 4) return null;
  
  return {
    x: parseFloat(parts[0]),
    y: parseFloat(parts[1]),
    width: parseFloat(parts[2]),
    height: parseFloat(parts[3]),
  };
}


/**
 * Calcola le safe areas in percentuali basate sul viewBox e sul rect
 */
function calculateSafeArea(viewBox: ViewBox, rect: SafeAreaRect): SafeArea {
  // Calcola le percentuali rispetto al viewBox
  const top = (rect.y / viewBox.height) * 100;
  const left = (rect.x / viewBox.width) * 100;
  const bottom = ((viewBox.height - (rect.y + rect.height)) / viewBox.height) * 100;
  const right = ((viewBox.width - (rect.x + rect.width)) / viewBox.width) * 100;
  
  return { top, right, bottom, left };
}

/**
 * Estrae la safe area da una stringa SVG
 */
export function extractSafeAreaFromSVGString(svgString: string): SafeArea | null {
  try {
    // Parsea l'SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // Verifica errori di parsing
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('Errore nel parsing SVG:', parserError.textContent);
      return null;
    }
    
    // Estrai viewBox
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      console.error('Nessun elemento SVG trovato');
      return null;
    }
    
    const viewBoxString = svgElement.getAttribute('viewBox');
    const viewBox = parseViewBox(viewBoxString);
    if (!viewBox) {
      console.error('ViewBox non valido o mancante');
      return null;
    }
    
    // Estrai il rect con id="safe-area"
    const safeAreaRect = doc.querySelector('rect[id="safe-area"]');
    if (!safeAreaRect) {
      console.warn('Nessun rect con id="safe-area" trovato nell\'SVG');
      return null;
    }
    
    const x = parseFloat(safeAreaRect.getAttribute('x') || '0');
    const y = parseFloat(safeAreaRect.getAttribute('y') || '0');
    const width = parseFloat(safeAreaRect.getAttribute('width') || '0');
    const height = parseFloat(safeAreaRect.getAttribute('height') || '0');
    
    const rect: SafeAreaRect = { x, y, width, height };
    
    // Calcola la safe area
    const safeArea = calculateSafeArea(viewBox, rect);
    console.log('extractSafeAreaFromSVGString: viewBox=', viewBox, 'rect=', rect, 'safeArea=', safeArea);
    return safeArea;
  } catch (error) {
    console.error('Errore nell\'estrazione della safe area dall\'SVG:', error);
    return null;
  }
}

/**
 * Carica e parsa un SVG per estrarre la safe area
 */
export async function loadSafeAreaFromSVG(svgPath: string): Promise<SafeArea | null> {
  try {
    // Carica l'SVG come testo
    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`Errore nel caricamento SVG: ${response.statusText}`);
    }
    
    const svgText = await response.text();
    
    // Usa la funzione helper per estrarre la safe area
    return extractSafeAreaFromSVGString(svgText);
  } catch (error) {
    console.error(`Errore nel caricamento della safe area da ${svgPath}:`, error);
    return null;
  }
}

/**
 * Cache per le safe areas caricate
 */
const safeAreaCache = new Map<string, SafeArea>();

/**
 * Carica tutte le safe areas per tutti gli stili di balloon
 */
export async function loadAllSafeAreas(
  balloonImages: Record<string, string>
): Promise<Record<string, SafeArea>> {
  const safeAreas: Record<string, SafeArea> = {};
  
  // Carica tutte le safe areas in parallelo
  const promises = Object.entries(balloonImages).map(async ([style, path]) => {
    // Controlla la cache
    if (safeAreaCache.has(path)) {
      safeAreas[style] = safeAreaCache.get(path)!;
      return;
    }
    
    // Carica la safe area
    const safeArea = await loadSafeAreaFromSVG(path);
    if (safeArea) {
      safeAreaCache.set(path, safeArea);
      safeAreas[style] = safeArea;
    }
  });
  
  await Promise.all(promises);
  
  return safeAreas;
}

/**
 * Estrae il path principale e il viewBox da un SVG
 */
export async function loadPathFromSVG(svgPath: string): Promise<{ path: string; viewBox: ViewBox } | null> {
  try {
    // Carica l'SVG come testo
    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`Errore nel caricamento SVG: ${response.statusText}`);
    }
    
    const svgText = await response.text();
    
    // Parsea l'SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Verifica errori di parsing
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('Errore nel parsing SVG:', parserError.textContent);
      return null;
    }
    
    // Estrai viewBox
    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      console.error('Nessun elemento SVG trovato');
      return null;
    }
    
    const viewBoxString = svgElement.getAttribute('viewBox');
    const viewBox = parseViewBox(viewBoxString);
    if (!viewBox) {
      console.error('ViewBox non valido o mancante');
      return null;
    }
    
    // Estrai il primo path (quello principale del balloon, non il rect safe-area)
    const paths = doc.querySelectorAll('path');
    const mainPath = Array.from(paths).find(p => {
      const id = p.getAttribute('id');
      return id !== 'safe-area' && !id; // Prendi il path senza id o che non sia safe-area
    });
    
    if (!mainPath) {
      console.error('Nessun path principale trovato nell\'SVG');
      return null;
    }
    
    const pathData = mainPath.getAttribute('d');
    if (!pathData) {
      console.error('Path senza attributo d');
      return null;
    }
    
    return { path: pathData, viewBox };
  } catch (error) {
    console.error(`Errore nel caricamento del path da ${svgPath}:`, error);
    return null;
  }
}

/**
 * Cache per i path caricati
 */
const pathCache = new Map<string, { path: string; viewBox: ViewBox }>();

/**
 * Carica tutti i path e viewBox per tutti gli stili di balloon
 */
export async function loadAllPaths(
  balloonImages: Record<string, string>
): Promise<Record<string, { path: string; viewBox: ViewBox }>> {
  const paths: Record<string, { path: string; viewBox: ViewBox }> = {};
  
  // Carica tutti i path in parallelo
  const promises = Object.entries(balloonImages).map(async ([style, path]) => {
    // Controlla la cache
    if (pathCache.has(path)) {
      paths[style] = pathCache.get(path)!;
      return;
    }
    
    // Carica il path
    const pathData = await loadPathFromSVG(path);
    if (pathData) {
      pathCache.set(path, pathData);
      paths[style] = pathData;
    }
  });
  
  await Promise.all(promises);
  
  return paths;
}

