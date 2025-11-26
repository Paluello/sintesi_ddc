import { useState, useEffect, useCallback, useRef } from 'react';
import { getCommentsForPostit, createComment } from '@/lib/api';
import { Comment, CommentCreateData } from '@/types/comment';

export function useComments(postitId: number | string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastPostitIdRef = useRef<number | string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    // Se postitId è null, resetta i commenti
    if (!postitId) {
      setComments([]);
      setLoading(false);
      setError(null);
      lastPostitIdRef.current = null;
      isFetchingRef.current = false;
      return;
    }

    // Se è lo stesso postitId e stiamo già facendo una chiamata, evita chiamate multiple
    if (postitId === lastPostitIdRef.current && isFetchingRef.current) {
      return;
    }

    // Se è lo stesso postitId ma non stiamo facendo una chiamata, non rifare la chiamata
    if (postitId === lastPostitIdRef.current && !isFetchingRef.current) {
      return;
    }

    // Aggiorna il riferimento e marca come in fetch
    lastPostitIdRef.current = postitId;
    isFetchingRef.current = true;

    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        // Plugin returns hierarchical structure with children
        const data = await getCommentsForPostit(postitId);
        setComments(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Errore nel caricamento dei commenti'));
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchComments();
  }, [postitId]);

  const fetchComments = useCallback(async () => {
    if (!postitId) {
      setComments([]);
      return;
    }

    // Reset del riferimento per forzare il refetch
    lastPostitIdRef.current = null;
    
    try {
      setLoading(true);
      setError(null);
      // Plugin returns hierarchical structure with children
      const data = await getCommentsForPostit(postitId);
      setComments(data);
      lastPostitIdRef.current = postitId;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Errore nel caricamento dei commenti'));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [postitId]);

  const addComment = useCallback(
    async (commentData: Omit<CommentCreateData, 'related'>) => {
      if (!postitId) {
        throw new Error('ID postit non valido');
      }

      try {
        // Plugin API requires postitId as first parameter
        const newComment = await createComment(postitId, commentData);
        // After creating, refetch to get updated hierarchical structure
        await fetchComments();
        return newComment;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Errore nella creazione del commento');
      }
    },
    [postitId, fetchComments]
  );

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    addComment,
  };
}

