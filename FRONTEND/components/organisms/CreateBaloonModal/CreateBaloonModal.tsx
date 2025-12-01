'use client';

import { useState } from 'react';
import { PostitCreateData, PostitStyle } from '@/types/postit';
import BaseModal from '../BaseModal/BaseModal';
import Input from '../../atoms/Input/Input';
import InputWithSubmitButton from '../../molecules/InputWithSubmitButton/InputWithSubmitButton';
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

const MAX_CHARACTERS = 450;

export default function CreateBaloonModal({ open, onClose, onSubmit }: CreateBaloonModalProps) {
  const [titolo, setTitolo] = useState('');
  const [testo, setTesto] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestoChange = (value: string) => {
    if (value.length <= MAX_CHARACTERS) {
      setTesto(value);
    }
  };

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
      imageClassName={styles.imageArea}
      contentClassName={styles.modalContent}
      ariaLabelledBy={titleId}
      relativeClose={true}
      svgPath="/images/rettangoli/rect_crea.svg"
    >
      <div className={styles.modalBody}>

        <div className={styles.form}>
          <div className={styles.field}>
            <Input
              id="titolo"
              value={titolo}
              onChange={setTitolo}
              variant="inline"
              disabled={loading}
              autoFocus
              required
              placeholder="Dai un titolo al tuo racconto"
            />
          </div>
          <div className={styles.field}>
            <InputWithSubmitButton
              value={testo}
              onChange={handleTestoChange}
              onSubmit={handleSubmit}
              canSubmit={!!titolo.trim() && !!testo.trim()}
              disabled={loading}
              loading={loading}
              placeholder="Racconta la tua storia"
              multiline={true}
              inputId="testo"
              buttonAriaLabel={loading ? 'Pubblicazione in corso...' : 'Pubblica'}
            />
            <div className={styles.characterCount}>
              {testo.length}/{MAX_CHARACTERS}
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
