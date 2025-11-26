'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useComments } from '@/hooks/useComments';
import { Postit } from '@/types/postit';
import BaseModal from './modals/BaseModal';
import SVGInputWrapper from './SVGInputWrapper';
import styles from './ModalOpenedBaloon.module.css';

interface ModalOpenedBaloonProps {
  open: boolean;
  onClose: () => void;
  postit: Postit | null;
}

const EXIT_ANIMATION_MS = 300;

export default function ModalOpenedBaloon({ open, onClose, postit }: ModalOpenedBaloonProps) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Memoizza postitIdentifier per evitare cambiamenti non necessari
  const postitIdentifier = useMemo(() => {
    if (!postit) return null;
    return postit.documentId || postit.id || null;
  }, [postit?.documentId, postit?.id]);
  
  // Passa null quando il modale è chiuso per evitare chiamate API non necessarie
  const { comments, loading, error, addComment } = useComments(open ? postitIdentifier : null);

  // Gestione visibilità e animazioni
  const [isVisible, setIsVisible] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }

    if (isVisible) {
      setIsClosing(true);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, EXIT_ANIMATION_MS);

      return () => clearTimeout(timeout);
    }
  }, [open, isVisible]);

  // Gestione ESC key e body overflow
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!commentText.trim() || !postit) {
      return;
    }

    try {
      setSubmitting(true);
      await addComment({ content: commentText.trim() });
      setCommentText('');
    } catch (err) {
      console.error('Errore nella creazione del commento:', err);
      alert('Errore nella creazione del commento. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAuthorName = (name: string | undefined | null) => {
    if (!name) return 'Anonimə';
    // Controllo case-insensitive per "anonimo"
    if (name.toLowerCase().trim() === 'anonimo') {
      return 'Anonimə';
    }
    return name;
  };

  const renderComment = (comment: typeof comments[0], depth = 0) => {
    // Prova a ottenere il nome da author.name o authorName (per compatibilità)
    const authorName = comment.author?.name || (comment as any).authorName || null;
    return (
      <div
        key={comment.id}
        className={`${styles.comment} ${depth > 0 ? styles.commentNested : ''}`}
      >
        <div className={styles.commentHeader}>
          <span className={styles.commentAuthor}>
            {formatAuthorName(authorName)}
          </span>
          <span className={styles.commentDate}>
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <div className={styles.commentContent}>{comment.content}</div>
        {comment.children && comment.children.length > 0 && (
          <div>
            {comment.children.map((child) => renderComment(child, depth + 1))}
          </div>
        )}
        {depth === 0 && <hr className={styles.divider} />}
      </div>
    );
  };

  // Image slot per il secondo modale (commenti)
  const commentsImageSlot = (
    <img
      src="/images/scritte/commenti_scritta.svg"
      alt="Commenti"
      loading="lazy"
    />
  );

  if (!isVisible) return null;

  const containerClasses = [
    styles.modalsContainer,
    isClosing ? styles.modalsContainerClosing : styles.modalsContainerOpening,
  ]
    .filter(Boolean)
    .join(' ');

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={containerClasses} 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      {/* Primo modale: Dettagli del postit */}
      <BaseModal
        open={open}
        onClose={onClose}
        contentClassName={styles.modalContentWhite}
        ariaLabelledBy="details-modal-title"
        hideOverlay={true}
        hideCloseButton={false}
        hideImage={true}
        svgFillColor="#fff"
      >
        <div className={styles.modalBody}>
          {postit && (
            <div className={styles.postitDetails}>
              <h1 className={styles.postitTitleLarge}>{postit.TITOLO}</h1>
              {postit.TESTO && (
                <p className={styles.postitText}>{postit.TESTO}</p>
              )}
            </div>
          )}
        </div>
      </BaseModal>

      {/* Secondo modale: Commenti */}
      <BaseModal
        open={open}
        onClose={onClose}
        imageSlot={commentsImageSlot}
        imageClassName={styles.commentsImageArea}
        contentClassName={styles.modalContent}
        ariaLabelledBy="comments-modal-title"
        hideOverlay={true}
        hideCloseButton={true}
      >
        <div className={styles.modalBody}>          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          )}

          {error && (
            <div className={styles.error}>{error.message}</div>
          )}

          {!loading && !error && (
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <div className={styles.emptyState}>
                  Nessun commento ancora. Sii il primo a commentare!
                </div>
              ) : (
                comments.map((comment) => renderComment(comment))
              )}
            </div>
          )}

          <div className={styles.commentForm}>
            <div className={styles.formRow}>
              <SVGInputWrapper>
                <textarea
                  className={styles.textarea}
                  placeholder="Aggiungi un commento"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={submitting || !postit}
                />
              </SVGInputWrapper>
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={submitting || !commentText.trim() || !postit}
                aria-label={submitting ? 'Invio in corso...' : 'Commenta'}
                title={submitting ? 'Invio...' : 'Commenta'}
              >
                <Image
                  src="/images/tasti/butt_send.svg"
                  alt="Commenta"
                  width={56}
                  height={56}
                  className={styles.submitButtonIcon}
                />
              </button>
            </div>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

