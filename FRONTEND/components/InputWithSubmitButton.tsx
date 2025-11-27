'use client';

import { useState, useEffect } from 'react';
import Input from './Input';
import styles from './InputWithSubmitButton.module.css';

interface InputWithSubmitButtonProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  canSubmit?: boolean; // Se true, il pulsante diventa rosso
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  multiline?: boolean; // Se true, usa textarea invece di input
  inputClassName?: string;
  buttonClassName?: string;
  wrapperClassName?: string;
  buttonIcon?: string; // Path all'icona SVG del pulsante (default: /images/tasti/butt_send.svg)
  buttonAriaLabel?: string;
  inputId?: string;
  inputName?: string;
  minHeight?: string; // Altezza minima per textarea
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export default function InputWithSubmitButton({
  value,
  onChange,
  onSubmit,
  canSubmit = false,
  disabled = false,
  loading = false,
  placeholder,
  multiline = false,
  inputClassName,
  buttonClassName,
  wrapperClassName,
  buttonIcon = '/images/tasti/butt_send.svg',
  buttonAriaLabel,
  inputId,
  inputName,
  minHeight,
  autoFocus = false,
  onKeyDown,
}: InputWithSubmitButtonProps) {
  const handleSubmit = async () => {
    if (disabled || loading || !canSubmit) {
      return;
    }
    await onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Invio con Enter (Ctrl+Enter per textarea)
    if (e.key === 'Enter' && (multiline ? e.ctrlKey : true) && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Chiama il callback personalizzato se fornito
    onKeyDown?.(e);
  };

  const isDisabled = disabled || loading || !canSubmit;
  
  // Carica l'SVG del pulsante e modifica il colore del cerchio
  const [baseSvgContent, setBaseSvgContent] = useState<string>('');
  
  // Carica l'SVG una volta
  useEffect(() => {
    fetch(buttonIcon)
      .then((res) => res.text())
      .then((text) => {
        setBaseSvgContent(text);
      })
      .catch((err) => {
        console.error('Errore nel caricamento dell\'SVG del pulsante:', err);
      });
  }, [buttonIcon]);
  
  // Modifica il colore del cerchio in base a canSubmit
  const svgContent = baseSvgContent ? (() => {
    let modifiedSvg = baseSvgContent;
    if (canSubmit) {
      // Cambia il fill del cerchio da nero a rosso
      modifiedSvg = modifiedSvg.replace(
        /\.cls-2\{fill:#000001;\}/g,
        `.cls-2{fill:var(--color-red);}`
      );
      // Gestisce anche il caso con spazi o formattazione diversa
      modifiedSvg = modifiedSvg.replace(
        /\.cls-2\s*\{\s*fill\s*:\s*#000001\s*;\s*\}/g,
        `.cls-2{fill:var(--color-red);}`
      );
    } else {
      // Assicurati che sia nero (ripristina il colore originale)
      modifiedSvg = modifiedSvg.replace(
        /\.cls-2\s*\{\s*fill\s*:[^;]+\s*;\s*\}/g,
        `.cls-2{fill:#000001;}`
      );
    }
    return modifiedSvg;
  })() : '';

  const buttonClasses = [
    styles.submitButton,
    buttonClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperClasses = [
    styles.wrapper,
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses}>
      <div className={styles.inputWrapper}>
        <Input
          value={value}
          onChange={onChange}
          variant={multiline ? 'large' : 'inline'}
          multiline={multiline}
          placeholder={placeholder}
          disabled={disabled || loading}
          id={inputId}
          name={inputName}
          minHeight={minHeight}
          autoFocus={autoFocus}
          className={inputClassName}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.buttonWrapper}>
        <button
          type="button"
          className={buttonClasses}
          onClick={handleSubmit}
          disabled={isDisabled}
          aria-label={buttonAriaLabel || (loading ? 'Invio in corso...' : 'Invia')}
          title={loading ? 'Invio...' : 'Invia'}
        >
          {svgContent ? (
            <div
              className={styles.submitButtonIcon}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className={styles.submitButtonIcon} style={{ width: 56, height: 56 }} />
          )}
        </button>
      </div>
    </div>
  );
}

