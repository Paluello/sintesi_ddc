'use client';

import { useState, useEffect } from 'react';
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

const DESKTOP_BREAKPOINT = 768;

export default function TutorialModal({ open, onClose, onComplete }: TutorialModalProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const titleId = 'tutorial-modal-title';
  const descriptionId = 'tutorial-modal-description';

  // Rileva se siamo su desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Reset alla prima sezione quando il modal si apre
  useEffect(() => {
    if (open) {
      setCurrentSection(0);
    }
  }, [open]);

  const handleClose = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  const handleNext = () => {
    if (currentSection < TUTORIAL_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const isFirstSection = currentSection === 0;
  const isLastSection = currentSection === TUTORIAL_SECTIONS.length - 1;

  // Determina lo sfondo SVG in base al breakpoint
  const svgPath = isDesktop 
    ? '/images/tut_desktop/sfondo_tutorial.svg'
    : '/images/rettangoli/sfondo_tutorial.svg';

  // Sezioni da mostrare: su desktop solo quella corrente, su mobile tutte
  const sectionsToShow = isDesktop 
    ? [TUTORIAL_SECTIONS[currentSection]]
    : TUTORIAL_SECTIONS;

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
      svgPath={svgPath}
    >
      <div className={styles.tutorialBody} id={descriptionId}>
        {isDesktop && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonLeft}`}
            onClick={handlePrev}
            disabled={isFirstSection}
            aria-label="Sezione precedente"
          >
            <img 
              src="/images/tut_desktop/left.svg" 
              alt="Precedente" 
              className={styles.navIcon}
            />
          </button>
        )}
        <div className={styles.sectionsContainer}>
          {sectionsToShow.map((section) => (
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
        {isDesktop && (
          <button
            type="button"
            className={`${styles.navButton} ${styles.navButtonRight}`}
            onClick={handleNext}
            disabled={isLastSection}
            aria-label="Sezione successiva"
          >
            <img 
              src="/images/tut_desktop/right.svg" 
              alt="Successiva" 
              className={styles.navIcon}
            />
          </button>
        )}
      </div>
    </BaseModal>
  );
}
