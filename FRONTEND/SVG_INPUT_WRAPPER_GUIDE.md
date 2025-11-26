# Guida Tecnica: Componente Input con SVG Deformabile

## Obiettivo

Creare un componente React/TypeScript che utilizza un SVG con `preserveAspectRatio="none"` come layer estetico sovrapposto a un input HTML standard, mantenendo la funzionalità completa dell'input.

## Principi di Implementazione

Il componente utilizza un pattern di overlay posizionato assolutamente: l'SVG viene posizionato sopra l'input tramite CSS `position: absolute`, mentre l'input mantiene il suo comportamento standard. L'SVG si adatta alle dimensioni dell'input usando calcoli proporzionali basati sul `viewBox` originale.

## Struttura del Componente

Il componente richiede:

- Un container con `position: relative`
- L'input HTML standard (input, textarea, etc.)
- Un SVG overlay con `position: absolute` e `pointer-events: none`
- Calcolo dinamico delle dimensioni SVG basato sulle dimensioni dell'input

## Snippet di Codice

### Snippet 1: Struttura Base JSX

```typescript
<div className={styles.wrapper} ref={containerRef}>
  <svg
    viewBox="0 0 36.5 17.4"
    width={svgWidth}
    height={svgHeight}
    preserveAspectRatio="none"
    className={styles.svgOverlay}
    style={{
      position: 'absolute',
      top: `${svgTop}px`,
      left: `${svgLeft}px`,
      pointerEvents: 'none',
      zIndex: 0,
    }}
  >
    <polygon points="34.9 .3 33.4 17.1 2.4 15.7 1.6 1.6 1.9 1.1 34.9 .3" fill="#0b0c0d" />
  </svg>
  <div className={styles.inputContainer} style={{ position: 'relative', zIndex: 1 }}>
    <input
      ref={inputRef}
      type="text"
      className={styles.input}
    />
  </div>
</div>
```

### Snippet 2: Calcolo Dimensioni e Posizionamento

```typescript
const measureAndUpdate = useCallback(() => {
  if (!inputRef.current || !containerRef.current) return;
  
  const inputElement = inputRef.current;
  const containerElement = containerRef.current;
  const inputRect = inputElement.getBoundingClientRect();
  const containerRect = containerElement.getBoundingClientRect();
  
  const contentWidth = inputElement.clientWidth;
  const contentHeight = inputElement.clientHeight;
  
  const viewBoxWidth = 36.5;
  const viewBoxHeight = 17.4;
  const safeAreaWidth = 29.4;
  const safeAreaHeight = 13.3;
  
  const widthScale = viewBoxWidth / safeAreaWidth;
  const heightScale = viewBoxHeight / safeAreaHeight;
  
  const newSvgWidth = contentWidth * widthScale;
  const newSvgHeight = contentHeight * heightScale;
  
  setSvgDimensions({ width: newSvgWidth, height: newSvgHeight });
  
  const safeAreaOffsetX = (3.5 / viewBoxWidth) * newSvgWidth;
  const safeAreaOffsetY = (2.1 / viewBoxHeight) * newSvgHeight;
  
  setSvgPosition({
    top: inputRect.top - containerRect.top - safeAreaOffsetY,
    left: inputRect.left - containerRect.left - safeAreaOffsetX,
  });
}, []);
```

## Note Tecniche

- L'SVG deve avere `preserveAspectRatio="none"` per permettere la deformazione
- `pointer-events: none` sull'SVG garantisce che l'input rimanga interattivo
- Il calcolo delle dimensioni usa il rapporto tra viewBox e safe-area per mantenere le proporzioni corrette
- Un `ResizeObserver` può essere utilizzato per aggiornare le dimensioni quando l'input cambia dimensione

