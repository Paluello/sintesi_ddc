/**
 * Configurazione dei colori di sfondo disponibili per la pagina
 * Questo file può essere facilmente esteso con nuovi colori
 */

export const BACKGROUND_COLORS = [
  '#AA3C27', // Rosso originale
  '#749147', // Verde scuro
  '#4D6AC4', // Blu scuro
  '#A14198', // Viola scuro
  '#C07932', // Siena scuro
  '#157F8F', // Verde Acqua
] as const;

export type BackgroundColor = typeof BACKGROUND_COLORS[number];

/**
 * Ottiene un colore casuale dalla palette disponibile
 * Il colore viene selezionato in modo deterministico basato su un seed
 * per garantire che lo stesso seed produca sempre lo stesso colore
 */
export function getRandomBackgroundColor(seed?: number): BackgroundColor {
  const index = seed !== undefined 
    ? seed % BACKGROUND_COLORS.length 
    : Math.floor(Math.random() * BACKGROUND_COLORS.length);
  
  return BACKGROUND_COLORS[index];
}

/**
 * Ottiene un colore basato su un hash della stringa fornita
 * Utile per generare colori consistenti basati su un identificatore
 */
export function getBackgroundColorFromString(str: string): BackgroundColor {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getRandomBackgroundColor(Math.abs(hash));
}

