'use client';

import React, { ReactNode, useEffect, useState, CSSProperties, useMemo } from 'react';
import { loadPathFromSVG, loadSafeAreaFromSVG, type SafeArea } from '@/lib/svgSafeArea';
import styles from './SVGInputWrapper.module.css';

interface SVGInputWrapperProps {
  children: ReactNode;
  className?: string;
  fillColor?: string;
  variant?: 'inline' | 'long'; // 'inline' per input normali, 'long' per textarea
}

type SVGData = {
  path: string;
  viewBox: { x: number; y: number; width: number; height: number };
  safeArea: SafeArea;
} | null;

export default function SVGInputWrapper({ 
  children, 
  className = '', 
  fillColor,
  variant = 'inline'
}: SVGInputWrapperProps) {
  const [svgData, setSvgData] = useState<SVGData>(null);

  useEffect(() => {
    const loadSVG = async () => {
      const svgPath = variant === 'inline' 
        ? '/images/rettangoli/rect_inlineinput.svg'
        : '/images/rettangoli/rect_longinput.svg';

      try {
        const [pathData, safeAreaData] = await Promise.all([
          loadPathFromSVG(svgPath),
          loadSafeAreaFromSVG(svgPath),
        ]);

        if (pathData && safeAreaData) {
          setSvgData({
            path: pathData.path,
            viewBox: pathData.viewBox,
            safeArea: safeAreaData,
          });
        }
      } catch (error) {
        console.error('Errore nel caricamento SVG:', error);
      }
    };

    loadSVG();
  }, [variant]);

  // Calcola le variabili CSS per il safe area (come in Postit.tsx)
  const safeAreaVars: CSSProperties = useMemo(() => {
    if (!svgData) {
      return {};
    }
    return {
      '--input-safe-inset-top': `${svgData.safeArea.top}%`,
      '--input-safe-inset-right': `${svgData.safeArea.right}%`,
      '--input-safe-inset-bottom': `${svgData.safeArea.bottom}%`,
      '--input-safe-inset-left': `${svgData.safeArea.left}%`,
    };
  }, [svgData]);

  const { path, viewBox } = svgData || { 
    path: '', 
    viewBox: { x: 0, y: 0, width: 283, height: 68.4 } 
  };
  const viewBoxString = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {/* Wrapper interno con aspectRatio per mantenere le proporzioni dell'SVG */}
      <div
        className={styles.innerWrapper}
        style={{
          aspectRatio: `${viewBox.width} / ${viewBox.height}`,
          ...safeAreaVars,
        }}
      >
        {/* SVG overlay con il path */}
        {svgData && (
          <svg
            viewBox={viewBoxString}
            preserveAspectRatio="none"
            className={styles.svgOverlay}
            style={{
              color: fillColor || 'var(--svg-fill-color, #0b0c0d)',
            }}
          >
            <path d={path} fill="currentColor" />
          </svg>
        )}
        {/* Safe area posizionato con variabili CSS (come in Postit) */}
        <div className={styles.inputSafeArea}>
          <div className={styles.inputContainer}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
