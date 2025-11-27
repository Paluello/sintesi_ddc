'use client';

import BaseModal from '../BaseModal/BaseModal';
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
    text: 'Questa è una bacheca digitale condivisa, dove puoi aggiungere in forma anonima le tue esperienze, dubbi o consigli. Puoi visitarla, leggere i contributi degli altri e, eventualmente, commentarli.',
  },
  {
    id: 2,
    image: '/images/scritte/tutorial-2.svg',
    alt: 'Tutorial capitolo 2',
    text: 'La bacheca è pensata per facilitare la condivisione dei propri pensieri, per sentirsi meno solɜ leggendo esperienze simili alle proprie, per scoprire idee o strategie a cui magari non avremmo pensato da solɜ.\n\nNon sostituisce le conversazioni dirette, ma permette di raggiungere anche chi normalmente non si riesce a coinvolgere: gli spunti raccolti qui possono diventare un patrimonio condiviso, rendendo più costruttivi i confronti anche sul posto di lavoro.',
  },
  {
    id: 3,
    image: '/images/scritte/tutorial-3.svg',
    alt: 'Tutorial capitolo 3',
    text: 'Ogni contributo può essere aperto e consultato in qualsiasi momento. È possibile aggiungere commenti per avviare vere e proprie conversazioni, sempre in forma anonima.\n\nPer aggiungere il tuo contributo, clicca sul tasto + e condividi il tuo pensiero.',
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
      wrapperClassName={styles.tutorialWrapper}
      overlayAlignItems="flex-start"
      svgPath="/images/rettangoli/sfondo_tutorial.svg"
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
            <div className={styles.textWrapper}>
              <p className={styles.tutorialText}>
                {section.text.split('\n\n').map((paragraph, index, array) => (
                  <span key={index}>
                    {paragraph.split('+').map((part, partIndex, partArray) => (
                      <span key={partIndex}>
                        {part}
                        {partIndex < partArray.length - 1 && (
                          <img 
                            src="/images/tasti/butt_plus.svg" 
                            alt="+" 
                            className={styles.plusIcon}
                          />
                        )}
                      </span>
                    ))}
                    {index < array.length - 1 && <><br /><br /></>}
                  </span>
                ))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
}
