'use client';

import IconButton from './IconButton';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onPlusClick?: () => void;
  onQuestionmarkClick?: () => void;
}

export default function Toolbar({ onPlusClick, onQuestionmarkClick }: ToolbarProps) {
  return (
    <div className={styles.toolbar} data-toolbar>
      <IconButton
        icon="plus"
        onClick={onPlusClick}
        aria-label="Aggiungi"
      />
      <IconButton
        icon="questionmark"
        onClick={onQuestionmarkClick}
        aria-label="Aiuto"
      />
    </div>
  );
}

