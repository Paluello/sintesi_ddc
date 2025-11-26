'use client';

import React, { ReactNode } from 'react';
import styles from './SVGInputWrapper.module.css';

interface SVGInputWrapperProps {
  children: ReactNode;
  className?: string;
  fillColor?: string;
}

export default function SVGInputWrapper({ children, className = '', fillColor }: SVGInputWrapperProps) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <svg
        viewBox="0 0 36.5 17.4"
        preserveAspectRatio="none"
        className={styles.svgOverlay}
        style={{
          color: fillColor || 'var(--svg-fill-color, #0b0c0d)',
        }}
      >
        <polygon points="34.9 .3 33.4 17.1 2.4 15.7 1.6 1.6 1.9 1.1 34.9 .3" fill="currentColor" />
      </svg>
      <div className={styles.inputContainer}>
        {children}
      </div>
    </div>
  );
}
