'use client';

import BaseModal from './modals/BaseModal';
import styles from './TutorialModal.module.css';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const TUTORIAL_SECTIONS = [
  {
    id: 1,
    image: '/images/scritte/tutorial-1.svg',
    alt: 'Tutorial capitolo 1',
  },
  {
    id: 2,
    image: '/images/scritte/tutorial-2.svg',
    alt: 'Tutorial capitolo 2',
  },
  {
    id: 3,
    image: '/images/scritte/tutorial-3.svg',
    alt: 'Tutorial capitolo 3',
  },
];

export default function TutorialModal({ open, onClose, onComplete }: TutorialModalProps) {
  const titleId = 'tutorial-modal-title';
  const descriptionId = 'tutorial-modal-description';

  const handleClose = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      hideImage={true}
      contentClassName={styles.tutorialContainer}
    >
      <div className={styles.tutorialBody} id={descriptionId}>
        {TUTORIAL_SECTIONS.map((section) => (
          <div key={section.id} className={styles.tutorialSection}>
            <div className={styles.imageWrapper}>
              <img 
                src={section.image} 
                alt={section.alt} 
                className={styles.tutorialImage}
              />
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
