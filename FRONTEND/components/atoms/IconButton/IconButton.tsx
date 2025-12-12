'use client';

import Image from 'next/image';
import styles from './IconButton.module.css';

export type IconType = 'plus' | 'questionmark' | 'menu' | 'cross';
export type ButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps {
  icon: IconType;
  size?: ButtonSize;
  onClick?: () => void;
  'aria-label'?: string;
}

const ICON_PATHS: Record<IconType, string> = {
  plus: '/images/tasti/butt_plus.svg',
  questionmark: '/images/tasti/butt_questionmark.svg',
  menu: '/images/tasti/butt_menu.svg',
  cross: '/images/tasti/butt_cross.svg',
};

export default function IconButton({ icon, size = 'medium', onClick, 'aria-label': ariaLabel }: IconButtonProps) {
  return (
    <button
      className={`${styles.iconButton} ${styles[size]}`}
      onClick={onClick}
      aria-label={ariaLabel || icon}
      type="button"
    >
      <Image
        src={ICON_PATHS[icon]}
        alt={ariaLabel || icon}
        width={70}
        height={70}
        className={styles.icon}
      />
    </button>
  );
}

