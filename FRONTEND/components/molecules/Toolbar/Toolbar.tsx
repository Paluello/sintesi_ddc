'use client';

import IconButton from '../../atoms/IconButton/IconButton';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onPlusClick?: () => void;
  onQuestionmarkClick?: () => void;
  onMenuClick?: () => void;
}

export default function Toolbar({ onPlusClick, onQuestionmarkClick, onMenuClick }: ToolbarProps) {
  return (
    <div className={styles.toolbar} data-toolbar>
      <div className={styles.leftGroup}>
        <IconButton
          icon="questionmark"
          onClick={onQuestionmarkClick}
          aria-label="Aiuto"
        />
      </div>
      <div className={styles.centerGroup}>
        <IconButton
          icon="plus"
          onClick={onPlusClick}
          aria-label="Aggiungi"
        />
      </div>
      <div className={styles.rightGroup}>
        <IconButton
          icon="menu"
          onClick={onMenuClick}
          aria-label="Menu"
        />
      </div>
    </div>
  );
}
