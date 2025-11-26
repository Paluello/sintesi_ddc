import { useState, useEffect, useRef, RefObject } from 'react';

interface UseTruncatedTextOptions {
  fullText: string;
  containerRef: RefObject<HTMLElement>;
  titleRef: RefObject<HTMLElement>;
  metaRef: RefObject<HTMLElement>;
  enabled?: boolean;
}

/**
 * Hook che calcola lo spazio disponibile per il testo e lo tronca di conseguenza
 * per evitare che venga tagliato bruscamente dal padding
 */
export function useTruncatedText({
  fullText,
  containerRef,
  titleRef,
  metaRef,
  enabled = true,
}: UseTruncatedTextOptions) {
  // Inizializza con il testo completo come placeholder
  const [truncatedText, setTruncatedText] = useState(fullText);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    if (!enabled || !fullText) {
      setTruncatedText(fullText);
      setIsCalculating(false);
      return;
    }
    
    setIsCalculating(true);

    const calculateTruncation = () => {
      const container = containerRef.current;
      const title = titleRef.current;
      const meta = metaRef.current;
      const textElement = textRef.current;

      if (!container || !title || !textElement) {
        setTruncatedText(fullText);
        return;
      }

      // Ottieni le dimensioni del container
      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;

      // Ottieni le dimensioni del titolo usando offsetHeight per l'altezza effettiva renderizzata
      // offsetHeight è più preciso per elementi con line-height ridotto perché considera solo lo spazio effettivamente occupato
      const titleHeight = title.offsetHeight;
      
      // Ottieni il margin-bottom del titolo
      const titleStyles = window.getComputedStyle(title);
      const titleMarginBottom = parseFloat(titleStyles.marginBottom) || 0;

      // Ottieni le dimensioni del meta (se presente)
      const metaHeight = meta ? meta.getBoundingClientRect().height : 0;
      
      // Ottieni il padding-top del meta (se presente)
      // Nota: margin-top: auto in flexbox non occupa spazio, quindi non lo consideriamo
      const metaStyles = meta ? window.getComputedStyle(meta) : null;
      const metaPaddingTop = metaStyles ? parseFloat(metaStyles.paddingTop) || 0 : 0;

      // Ottieni il padding del container
      const containerStyles = window.getComputedStyle(container);
      const paddingTop = parseFloat(containerStyles.paddingTop) || 0;
      const paddingBottom = parseFloat(containerStyles.paddingBottom) || 0;
      const totalPadding = paddingTop + paddingBottom;

      // Calcola l'altezza di una riga di testo misurandola direttamente
      // Crea un elemento temporaneo con una singola riga per misurare l'altezza
      const lineMeasureElement = document.createElement('p');
      lineMeasureElement.style.cssText = window.getComputedStyle(textElement).cssText;
      lineMeasureElement.style.position = 'absolute';
      lineMeasureElement.style.visibility = 'hidden';
      lineMeasureElement.style.width = `${textElement.offsetWidth}px`;
      lineMeasureElement.style.height = 'auto';
      lineMeasureElement.style.overflow = 'visible';
      lineMeasureElement.style.whiteSpace = 'pre-wrap';
      lineMeasureElement.style.wordWrap = 'break-word';
      lineMeasureElement.textContent = 'M'; // Una singola riga di testo
      document.body.appendChild(lineMeasureElement);
      const oneLineHeight = lineMeasureElement.offsetHeight;
      
      // Calcola lo spazio necessario per i "..."
      lineMeasureElement.textContent = '...';
      const ellipsisHeight = lineMeasureElement.offsetHeight;
      document.body.removeChild(lineMeasureElement);

      // Calcola lo spazio disponibile per il testo
      // Include i margin del titolo e il padding-top del meta
      // NON sottraiamo ellipsisHeight qui perché è già considerato nel binary search
      // Usiamo un buffer molto piccolo (0.3 righe) per lasciare un po' di margine ma non troppo
      const availableHeight = containerHeight 
        - titleHeight 
        - titleMarginBottom 
        - metaHeight 
        - metaPaddingTop
        - totalPadding 
        - (oneLineHeight * 0.3);

      if (availableHeight <= 0) {
        setTruncatedText('');
        return;
      }

      // Crea un elemento temporaneo per misurare il testo
      const tempElement = document.createElement('p');
      tempElement.style.cssText = window.getComputedStyle(textElement).cssText;
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.width = `${textElement.offsetWidth}px`;
      tempElement.style.height = 'auto';
      tempElement.style.overflow = 'visible';
      tempElement.style.whiteSpace = 'pre-wrap';
      tempElement.style.wordWrap = 'break-word';
      document.body.appendChild(tempElement);

      // Funzione per trovare il punto di troncamento usando binary search
      const findTruncationPoint = (text: string): { text: string; wasTruncated: boolean } => {
        if (!text) return { text: '', wasTruncated: false };

        // Prima prova con il testo completo
        tempElement.textContent = text;
        let textHeight = tempElement.offsetHeight;

        if (textHeight <= availableHeight) {
          return { text, wasTruncated: false };
        }

        // Binary search per trovare il punto di troncamento ottimale
        // Considera anche lo spazio per i "..."
        let left = 0;
        let right = text.length;
        let bestMatch = '';

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const testText = text.substring(0, mid);
          
          // Testa il testo con i "..."
          tempElement.textContent = testText + '...';
          textHeight = tempElement.offsetHeight;

          if (textHeight <= availableHeight) {
            bestMatch = testText;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        // Se abbiamo trovato un match, cerca l'ultimo punto di interruzione per un taglio più pulito
        if (bestMatch) {
          // Cerca punti di interruzione naturali (newline, punto, spazio)
          const lastNewline = bestMatch.lastIndexOf('\n');
          const lastPeriod = bestMatch.lastIndexOf('. ');
          const lastSpace = bestMatch.lastIndexOf(' ');
          
          // Preferisci newline, poi punto, poi spazio
          let lastBreak = -1;
          if (lastNewline > bestMatch.length * 0.7) {
            lastBreak = lastNewline;
          } else if (lastPeriod > bestMatch.length * 0.7) {
            lastBreak = lastPeriod + 1; // Include il punto
          } else if (lastSpace > bestMatch.length * 0.7) {
            lastBreak = lastSpace;
          }

          // Se troviamo un punto di interruzione ragionevole
          if (lastBreak > bestMatch.length * 0.7) {
            const truncatedText = bestMatch.substring(0, lastBreak);
            // Verifica che ci sia ancora spazio per i "..."
            tempElement.textContent = truncatedText + '...';
            if (tempElement.offsetHeight <= availableHeight) {
              return { text: truncatedText + '...', wasTruncated: true };
            }
            // Se non c'è spazio, prova senza i "..."
            tempElement.textContent = truncatedText;
            if (tempElement.offsetHeight <= availableHeight) {
              return { text: truncatedText, wasTruncated: true };
            }
          }
          
          // Se non abbiamo trovato un punto di interruzione, aggiungi i "..." al bestMatch
          tempElement.textContent = bestMatch + '...';
          if (tempElement.offsetHeight <= availableHeight) {
            return { text: bestMatch + '...', wasTruncated: true };
          }
          // Se non c'è spazio per i "...", restituisci il testo senza
          return { text: bestMatch, wasTruncated: true };
        }

        return { text: bestMatch, wasTruncated: true };
      };

      const result = findTruncationPoint(fullText);
      const truncated = result.text;
      
      // Cleanup dell'elemento temporaneo
      if (document.body.contains(tempElement)) {
        document.body.removeChild(tempElement);
      }
      
      setTruncatedText(truncated);
      setIsCalculating(false);
    };

    // Ricalcola quando cambiano le dimensioni della finestra o del container
    // Usa un timeout per evitare calcoli eccessivi durante il resize
    let resizeTimeout: NodeJS.Timeout | undefined;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        calculateTruncation();
      }, 100); // Debounce di 100ms
    });

    // Calcola il troncamento iniziale dopo che gli elementi sono stati montati
    // Usa requestAnimationFrame per minimizzare il delay visivo
    const rafId = requestAnimationFrame(() => {
      calculateTruncation();
    });

    const container = containerRef.current;
    const title = titleRef.current;
    const meta = metaRef.current;

    if (container) {
      resizeObserver.observe(container);
    }
    if (title) {
      resizeObserver.observe(title);
    }
    if (meta) {
      resizeObserver.observe(meta);
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
    };
  }, [fullText, containerRef, titleRef, metaRef, enabled]);

  return { truncatedText, textRef, isCalculating };
}

