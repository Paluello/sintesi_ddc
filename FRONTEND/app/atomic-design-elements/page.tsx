'use client';

import CenteredButton from '@/components/CenteredButton';
import styles from './page.module.css';

export default function AtomicDesignElementsPage() {
  const handleButtonClick = () => {
    console.log('Pulsante cliccato!');
  };

  return (
    <div className={styles.container}>
      <CenteredButton onClick={handleButtonClick} />
    </div>
  );
}

