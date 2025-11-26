'use client';

import { useState } from 'react';
import { PostitCreateData, PostitStyle } from '@/types/postit';
import BaseModal from './modals/BaseModal';
import SVGInputWrapper from './SVGInputWrapper';
import SVGButtonWrapper from './SVGButtonWrapper';
import styles from './CreateBaloonModal.module.css';

interface CreateBaloonModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PostitCreateData) => Promise<void>;
}

const getRandomStyle = (): PostitStyle => {
  const stylesList: PostitStyle[] = ['a', 'b', 'c', 'd'];
  return stylesList[Math.floor(Math.random() * stylesList.length)];
};

export default function CreateBaloonModal({ open, onClose, onSubmit }: CreateBaloonModalProps) {
  const [titolo, setTitolo] = useState('');
  const [testo, setTesto] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!titolo.trim() || !testo.trim()) {
      return;
    }

    try {
      setLoading(true);
      const randomStyle = getRandomStyle();
      await onSubmit({
        TITOLO: titolo.trim(),
        TESTO: testo.trim(),
        STILE: randomStyle,
      });
      setTitolo('');
      setTesto('');
      onClose();
    } catch (error) {
      console.error('Errore nella creazione del baloon:', error);
      alert('Errore nella creazione del baloon. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    setTitolo('');
    setTesto('');
    onClose();
  };

  const imageSlot = (
    <img
      src="/images/scritte/creazione_scritta.svg"
      alt="Creazione"
      loading="lazy"
    />
  );

  const titleId = 'create-baloon-title';

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      imageSlot={imageSlot}
      contentClassName={styles.modalContent}
      ariaLabelledBy={titleId}
      relativeClose={true}
    >
      <div className={styles.modalBody}>

        <div className={styles.form}>
          <div className={styles.field}>
            <SVGInputWrapper>
              <input
                id="titolo"
                type="text"
                className={styles.input}
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                disabled={loading}
                autoFocus
                required
                placeholder="Dai un titolo al tuo racconto"
              />
            </SVGInputWrapper>
          </div>
          <div className={styles.field}>
            <SVGInputWrapper>
              <textarea
                id="testo"
                className={`${styles.input} ${styles.textarea}`}
                value={testo}
                onChange={(e) => setTesto(e.target.value)}
                disabled={loading}
                required
                placeholder="Racconta la tua storia"
              />
            </SVGInputWrapper>
          </div>
        </div>
        <div className={styles.actions}>
          <SVGButtonWrapper fillColor="var(--color-red)">
            <button
              className={`${styles.button} ${styles.buttonSubmit}`}
              onClick={handleSubmit}
              disabled={loading || !titolo.trim() || !testo.trim()}
            >
              {loading ? 'Pubblicazione...' : 'Pubblica'}
            </button>
          </SVGButtonWrapper>
        </div>
      </div>
    </BaseModal>
  );
}
