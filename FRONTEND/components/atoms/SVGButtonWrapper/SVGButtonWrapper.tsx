'use client';

import React, { useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import styles from './SVGButtonWrapper.module.css';

interface SVGButtonWrapperProps {
  children: ReactNode;
  className?: string;
  fillColor?: string;
}

export default function SVGButtonWrapper({ children, className = '', fillColor }: SVGButtonWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLElement | null>(null);
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
  const [svgPosition, setSvgPosition] = useState({ top: 0, left: 0 });

  const measureAndUpdate = useCallback(() => {
    if (!buttonRef.current || !containerRef.current) return;

    const buttonElement = buttonRef.current;
    const containerElement = containerRef.current;
    const buttonRect = buttonElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();

    const contentWidth = buttonElement.clientWidth;
    const contentHeight = buttonElement.clientHeight;

    const viewBoxWidth = 36.5;
    const viewBoxHeight = 17.4;
    const safeAreaWidth = 29.4;
    const safeAreaHeight = 13.3;

    const widthScale = viewBoxWidth / safeAreaWidth;
    const heightScale = viewBoxHeight / safeAreaHeight;

    // Per i bottoni, usiamo la larghezza del bottone (che include già il padding)
    const newSvgWidth = contentWidth * widthScale;
    const newSvgHeight = contentHeight * heightScale;

    setSvgDimensions({ width: newSvgWidth, height: newSvgHeight });

    const safeAreaOffsetX = (3.5 / viewBoxWidth) * newSvgWidth;
    const safeAreaOffsetY = (2.1 / viewBoxHeight) * newSvgHeight;

    // Posizioniamo l'SVG in modo che il suo safe area corrisponda esattamente al bottone
    // Il safe area dell'SVG inizia a safeAreaOffsetX dal bordo sinistro dell'SVG
    // Quindi l'SVG deve essere posizionato a: bottone.left - safeAreaOffsetX
    setSvgPosition({
      top: buttonRect.top - containerRect.top - safeAreaOffsetY,
      left: buttonRect.left - containerRect.left - safeAreaOffsetX,
    });
  }, []);

  useEffect(() => {
    if (!buttonRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(measureAndUpdate);
    });

    resizeObserver.observe(buttonRef.current);

    const timeoutId = setTimeout(() => {
      measureAndUpdate();
    }, 0);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [measureAndUpdate]);

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(measureAndUpdate);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [measureAndUpdate]);

  const childWithRef = (() => {
    if (!children || typeof children !== 'object' || !('props' in children)) {
      return children;
    }

    return React.cloneElement(children as React.ReactElement, {
      ref: (node: HTMLElement | null) => {
        buttonRef.current = node;
        const originalRef = (children as any).ref;
        if (typeof originalRef === 'function') {
          originalRef(node);
        } else if (originalRef && 'current' in originalRef) {
          (originalRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }
      },
    });
  })();

  return (
    <div className={`${styles.wrapper} ${className}`} ref={containerRef}>
      {svgDimensions.width > 0 && svgDimensions.height > 0 && (
        <svg
          viewBox="0 0 36.5 17.4"
          width={svgDimensions.width}
          height={svgDimensions.height}
          preserveAspectRatio="none"
          className={styles.svgOverlay}
          style={{
            position: 'absolute',
            top: `${svgPosition.top}px`,
            left: `${svgPosition.left}px`,
            pointerEvents: 'none',
            zIndex: 0,
            color: fillColor || 'var(--svg-fill-color, #0b0c0d)',
          }}
        >
          <polygon points="34.9 .3 33.4 17.1 2.4 15.7 1.6 1.6 1.9 1.1 34.9 .3" fill="currentColor" />
        </svg>
      )}
      <div className={styles.buttonContainer} style={{ position: 'relative', zIndex: 1 }}>
        {childWithRef}
      </div>
    </div>
  );
}

