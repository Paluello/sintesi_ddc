/**
 * Utility per modificare i colori degli SVG dinamicamente
 * Questo modulo fornisce funzioni per sostituire colori negli SVG senza modificare i file sorgente
 */

/**
 * Sostituisce un colore con un altro negli attributi fill e stroke di un SVG
 * @param svgContent Contenuto SVG come stringa
 * @param oldColor Colore da sostituire (es. "#802928" o "rgb(...)")
 * @param newColor Nuovo colore (es. "#802928" o "rgb(...)")
 * @returns SVG modificato con il nuovo colore
 */
export function updateSVGColor(
  svgContent: string,
  oldColor: string,
  newColor: string
): string {
  // Normalizza i colori per il matching (rimuovi spazi, converti in lowercase)
  const normalizedOldColor = oldColor.trim().toLowerCase();
  
  // Crea regex per matchare il colore in attributi fill e stroke
  // Matcha sia fill="#color" che fill='color' e anche senza virgolette
  const fillRegex = new RegExp(
    `fill=["']?${normalizedOldColor.replace('#', '#?')}["']?`,
    'gi'
  );
  const strokeRegex = new RegExp(
    `stroke=["']?${normalizedOldColor.replace('#', '#?')}["']?`,
    'gi'
  );
  
  // Sostituisci i colori
  let modifiedContent = svgContent.replace(fillRegex, `fill="${newColor}"`);
  modifiedContent = modifiedContent.replace(strokeRegex, `stroke="${newColor}"`);
  
  return modifiedContent;
}

/**
 * Cache per gli SVG modificati: chiave = "path:color", valore = SVG modificato
 */
const svgCache = new Map<string, string>();

/**
 * Carica un SVG e applica la modifica del colore
 * @param svgPath Percorso relativo all'SVG (es. "/images/baloons/baloon-1.svg")
 * @param color Nuovo colore da applicare (es. "#802928")
 * @returns Promise che risolve con l'URL dell'SVG modificato (data URL)
 */
export async function getSVGWithColor(
  svgPath: string,
  color: string
): Promise<string> {
  // Controlla la cache
  const cacheKey = `${svgPath}:${color}`;
  if (svgCache.has(cacheKey)) {
    return svgCache.get(cacheKey)!;
  }
  
  try {
    // Carica l'SVG originale
    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.statusText}`);
    }
    
    const svgContent = await response.text();
    
    // Colore originale dei bordi negli SVG
    const originalColor = '#802928';
    
    // Applica la modifica del colore
    const modifiedSVG = updateSVGColor(svgContent, originalColor, color);
    
    // Converti in data URL
    const blob = new Blob([modifiedSVG], { type: 'image/svg+xml' });
    const dataUrl = URL.createObjectURL(blob);
    
    // Salva in cache
    svgCache.set(cacheKey, dataUrl);
    
    return dataUrl;
  } catch (error) {
    console.error(`Errore nel caricamento/modifica dell'SVG ${svgPath}:`, error);
    // Fallback: ritorna il path originale
    return svgPath;
  }
}

/**
 * Pulisce la cache degli SVG modificati
 * Utile per liberare memoria quando necessario
 */
export function clearSVGCache(): void {
  // Revoca tutti gli URL creati
  svgCache.forEach((url) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  svgCache.clear();
}

