'use client';

import React from 'react';
import SVGInputWrapper from './SVGInputWrapper';
import styles from './Input.module.css';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'inline' | 'large'; // 'inline' per input normali, 'large' per textarea
  multiline?: boolean; // Se true, usa textarea invece di input
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  minHeight?: string; // Altezza minima per textarea
  autoFocus?: boolean;
  required?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function Input({
  value,
  onChange,
  variant = 'inline',
  multiline = false,
  placeholder,
  disabled = false,
  id,
  name,
  minHeight,
  autoFocus = false,
  required = false,
  className,
  onKeyDown,
}: InputProps) {
  const inputClasses = [
    styles.input,
    multiline ? styles.textarea : '',
    variant === 'large' ? styles.large : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const svgVariant = multiline ? 'long' : 'inline';

  return (
    <SVGInputWrapper variant={svgVariant}>
      {multiline ? (
        <textarea
          id={id}
          name={name}
          className={inputClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          style={minHeight ? { minHeight } : undefined}
        />
      ) : (
        <input
          id={id}
          name={name}
          type="text"
          className={inputClasses}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
        />
      )}
    </SVGInputWrapper>
  );
}

