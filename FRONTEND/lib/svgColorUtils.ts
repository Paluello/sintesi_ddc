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
  
  // Escape caratteri speciali per la regex, ma gestisci il # in modo speciale
  // Se il colore inizia con #, crea un pattern che matcha sia con che senza #
  const colorPattern = normalizedOldColor.startsWith('#') 
    ? `#?${normalizedOldColor.slice(1)}` // Rimuovi il # iniziale e aggiungi #? opzionale
    : normalizedOldColor;
  
  // Crea regex per matchare il colore in attributi fill e stroke
  // Matcha sia fill="#color" che fill='color' e anche senza virgolette
  const fillRegex = new RegExp(
    `fill=["']?${colorPattern}["']?`,
    'gi'
  );
  const strokeRegex = new RegExp(
    `stroke=["']?${colorPattern}["']?`,
    'gi'
  );
  
  // Sostituisci i colori
  let modifiedContent = svgContent.replace(fillRegex, `fill="${newColor}"`);
  modifiedContent = modifiedContent.replace(strokeRegex, `stroke="${newColor}"`);
  
  return modifiedContent;
}

/**
 * Determina se un colore è più vicino al bianco o al nero
 * @param color Colore in formato hex (es. "#ffffff" o "#000000")
 * @returns true se il colore è più vicino al bianco, false se è più vicino al nero
 */
function isLightColor(color: string): boolean {
  // Normalizza il colore
  const normalizedColor = color.trim().toLowerCase();
  
  // Se è bianco o molto chiaro
  if (normalizedColor === '#ffffff' || normalizedColor === '#fff' || normalizedColor === 'white') {
    return true;
  }
  
  // Se è nero o molto scuro
  if (normalizedColor === '#000000' || normalizedColor === '#000' || normalizedColor === 'black') {
    return false;
  }
  
  // Estrai i valori RGB
  let r = 0, g = 0, b = 0;
  
  if (normalizedColor.startsWith('#')) {
    const hex = normalizedColor.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  }
  
  // Calcola la luminosità (formula standard)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Se la luminosità è maggiore di 128, è più vicino al bianco
  return brightness > 128;
}

/**
 * Modifica l'SVG del pulsante download zine con i colori corretti
 * Il testo (id="testo") avrà il colore opposto allo sfondo generale
 * Lo sfondo (id="sfondo") avrà il colore dello sfondo generale
 * @param svgContent Contenuto SVG come stringa
 * @param bgColor Colore dello sfondo generale (es. "#ffffff" o "#000000")
 * @returns SVG modificato con i colori corretti
 */
function updateZineDownloadButtonColors(svgContent: string, bgColor: string): string {
  // Determina se lo sfondo generale è chiaro o scuro
  const isBgLight = isLightColor(bgColor);
  
  // Colore del testo = opposto allo sfondo generale
  const textColor = isBgLight ? '#000000' : '#ffffff';
  
  // Colore dello sfondo del pulsante = colore dello sfondo generale
  const buttonBgColor = bgColor;
  
  let modifiedContent = svgContent;
  
  // Sostituisci il colore nel gruppo "testo" (tutti i path con fill="#fbfafa")
  // Cerca il gruppo con id="testo" e sostituisci tutti i fill="#fbfafa" al suo interno
  const testoGroupRegex = /(<g\s+id=["']testo["'][^>]*>)([\s\S]*?)(<\/g>)/gi;
  modifiedContent = modifiedContent.replace(testoGroupRegex, (match, openTag, content, closeTag) => {
    // Sostituisci tutti i fill="#fbfafa" nel contenuto del gruppo
    const updatedContent = content.replace(/fill=["']#fbfafa["']/gi, `fill="${textColor}"`);
    return openTag + updatedContent + closeTag;
  });
  
  // Aggiungi o sostituisci il fill nel path con id="sfondo"
  // Gestisce sia path auto-chiusi (<path ... />) che path con tag di chiusura (<path ...></path>)
  const sfondoPathRegex = /(<path\s+id=["']sfondo["'][^>]*?)(\s*\/?>|>)/gi;
  modifiedContent = modifiedContent.replace(sfondoPathRegex, (match, pathStart, closing) => {
    // Se non ha già un fill, aggiungilo prima della chiusura
    if (!pathStart.includes('fill=')) {
      // Aggiungi uno spazio se necessario
      const separator = pathStart.endsWith(' ') ? '' : ' ';
      return `${pathStart}${separator}fill="${buttonBgColor}"${closing}`;
    } else {
      // Sostituisci il fill esistente
      return pathStart.replace(/fill=["'][^"']*["']/gi, `fill="${buttonBgColor}"`) + closing;
    }
  });
  
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
    
    // Determina quale colore sostituire in base alla struttura dell'SVG e al path:
    // - Se il path contiene "pulsante_download" (pulsante download zine), usa la funzione specifica
    //   che gestisce i gruppi id="testo" e id="sfondo"
    // - Se l'SVG contiene #802928 (bordo dei baloon), sostituiamo solo quello
    //   e lasciamo il bianco (#fff) intatto (per i baloon, il bianco è lo sfondo)
    // - Altrimenti sostituiamo il bianco (#fff) con il colore passato
    //   (per altri SVG come rettangolini-04.svg)
    const isZineDownloadButton = svgPath.includes('pulsante_download');
    const hasBorderColor = svgContent.includes('#802928');
    const hasZineButtonColor = svgContent.includes('#fbfafa');
    
    let modifiedSVG: string;
    
    if (isZineDownloadButton && svgContent.includes('id="sfondo"') && svgContent.includes('id="testo"')) {
      // Per il pulsante download zine, usa la funzione specifica che gestisce i gruppi
      // Il colore passato rappresenta lo sfondo generale
      modifiedSVG = updateZineDownloadButtonColors(svgContent, color);
    } else {
      // Per gli altri SVG, usa la logica standard
      let colorToReplace = '#fff';
      if (hasBorderColor) {
        colorToReplace = '#802928';
      } else if (hasZineButtonColor) {
        colorToReplace = '#fbfafa';
      }
      
      // Applica la modifica del colore
      modifiedSVG = updateSVGColor(svgContent, colorToReplace, color);
    }
    
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

/**
 * Estrae il primo colore fill o stroke da un SVG
 * @param svgContent Contenuto SVG come stringa
 * @returns Colore estratto in formato hex (es. "#ffffff") o null se non trovato
 */
export function extractColorFromSVG(svgContent: string): string | null {
  // Cerca tutti gli attributi fill nel contenuto SVG
  const fillMatches = svgContent.matchAll(/fill=["']([^"']+)["']/gi);
  
  for (const match of fillMatches) {
    if (match[1]) {
      const color = match[1].trim();
      // Ignora valori speciali
      if (color === 'none' || color === 'currentColor' || color === 'transparent') {
        continue;
      }
      // Se è già in formato hex, ritorna così
      if (color.startsWith('#')) {
        return color;
      }
      // Se è rgb/rgba, prova a convertirlo
      if (color.startsWith('rgb')) {
        // Per ora ritorniamo il colore così com'è
        // Potremmo convertirlo in hex se necessario
        return color;
      }
      // Se è un nome di colore CSS, potremmo convertirlo, ma per ora lo ritorniamo
      return color;
    }
  }
  
  // Se non c'è fill, cerca stroke
  const strokeMatches = svgContent.matchAll(/stroke=["']([^"']+)["']/gi);
  
  for (const match of strokeMatches) {
    if (match[1]) {
      const color = match[1].trim();
      if (color === 'none' || color === 'currentColor' || color === 'transparent') {
        continue;
      }
      if (color.startsWith('#')) {
        return color;
      }
      return color;
    }
  }
  
  // Se non troviamo colori espliciti, cerca nel primo elemento path o altro elemento grafico
  // e usa il colore di default basato sul contesto (nero o bianco)
  // Per ora ritorniamo null e useremo un colore di default nel componente
  return null;
}

