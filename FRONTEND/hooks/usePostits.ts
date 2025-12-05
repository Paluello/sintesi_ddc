import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPostits, createPostit, updatePostit } from '@/lib/api';
import { Postit, PostitCreateData } from '@/types/postit';

// Funzione helper per verificare se un errore è un errore di connessione
function isConnectionError(error: any): boolean {
  // Errori di rete axios
  if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNREFUSED' || 
      error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
    return true;
  }
  // Se non c'è response, probabilmente è un errore di rete
  if (error && !error.response) {
    return true;
  }
  // Controlla il messaggio di errore
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('network') || message.includes('connection') || 
      message.includes('failed to fetch') || message.includes('fetch failed')) {
    return true;
  }
  return false;
}

// Funzione per generare post-it mock quando il server non è raggiungibile
function generateMockPostits(): Postit[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      documentId: 'mock-1',
      TITOLO: 'Benvenuto!',
      TESTO: 'Questo è un post-it di esempio. Il server non è raggiungibile al momento.',
      X: 200,
      Y: 150,
      STILE: 'a',
      settore: {
        id: 1,
        NOME: 'Esempio',
      },
      tema: {
        id: 1,
        NOME: 'Generale',
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
    {
      id: 2,
      documentId: 'mock-2',
      TITOLO: 'Modalità Offline',
      TESTO: 'Stai visualizzando post-it di esempio perché non è possibile connettersi al server.',
      X: 500,
      Y: 300,
      STILE: 'b',
      settore: {
        id: 2,
        NOME: 'Sistema',
      },
      tema: {
        id: 2,
        NOME: 'Informazioni',
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
    {
      id: 3,
      documentId: 'mock-3',
      TITOLO: 'Nota Importante',
      TESTO: 'Quando la connessione sarà ripristinata, vedrai i post-it reali dal server.',
      X: 800,
      Y: 450,
      STILE: 'c',
      settore: {
        id: 3,
        NOME: 'Notifiche',
      },
      tema: {
        id: 3,
        NOME: 'Avviso',
      },
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    },
  ];
}

// Funzione helper per ottenere la data di riferimento (updatedAt o createdAt)
function getReferenceDate(postit: Postit): Date {
  const dateString = postit.updatedAt || postit.createdAt;
  return new Date(dateString);
}

// Funzione per ordinare i postit in base alla data di modifica/creazione (più recente prima)
function sortPostitsByDate(postits: Postit[]): Postit[] {
  return [...postits].sort((a, b) => {
    const dateA = getReferenceDate(a).getTime();
    const dateB = getReferenceDate(b).getTime();
    return dateB - dateA; // Ordine decrescente (più recente prima)
  });
}

// Funzione per calcolare lo z-index basato sul timestamp
// Questo rende lo z-index stabile anche quando l'array viene riordinato
// Usa un range più ampio per evitare conflitti
function calculateZIndexFromTimestamp(postit: Postit, allPostits: Postit[]): number {
  const referenceDate = getReferenceDate(postit).getTime();
  // Trova il timestamp più recente e più vecchio per normalizzare
  const timestamps = allPostits.map(p => getReferenceDate(p).getTime());
  const maxTimestamp = Math.max(...timestamps);
  const minTimestamp = Math.min(...timestamps);
  
  // Se tutti i postit hanno lo stesso timestamp, usa l'ID come tiebreaker
  if (maxTimestamp === minTimestamp) {
    return postit.id;
  }
  
  // Normalizza tra 1 e 10000 (range ampio per evitare conflitti)
  const normalized = ((referenceDate - minTimestamp) / (maxTimestamp - minTimestamp)) * 9999 + 1;
  return Math.floor(normalized);
}


export function usePostits() {
  const [postits, setPostits] = useState<Postit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const fetchPostits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsOfflineMode(false);
      const data = await getPostits();
      // Ordina i postit in base alla data di modifica/creazione
      const sortedData = sortPostitsByDate(data);
      setPostits(sortedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Errore nel caricamento dei postit');
      setError(error);
      
      // Se è un errore di connessione, usa post-it mock
      if (isConnectionError(err)) {
        console.warn('[usePostits] Errore di connessione rilevato, uso post-it mock');
        const mockPostits = generateMockPostits();
        const sortedMockPostits = sortPostitsByDate(mockPostits);
        setPostits(sortedMockPostits);
        setIsOfflineMode(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPostits();
  }, [fetchPostits]);

  // Retry periodico quando siamo in modalità offline
  useEffect(() => {
    if (!isOfflineMode) return;

    const retryInterval = setInterval(() => {
      console.log('[usePostits] Retry connessione al server...');
      fetchPostits();
    }, 3000); // Riprova ogni 3 secondi

    return () => clearInterval(retryInterval);
  }, [isOfflineMode, fetchPostits]);

  const addPostit = useCallback(
    async (postitData: PostitCreateData) => {
      try {
        // Le coordinate vengono passate direttamente senza alcuna conversione
        const newPostit = await createPostit(postitData);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[addPostit] Postit creato:', {
            id: newPostit.id,
            coordinate: { X: newPostit.X, Y: newPostit.Y },
          });
        }
        
        // Aggiungi il nuovo postit e riordina l'array
        setPostits((prev) => {
          const updated = [...prev, newPostit];
          return sortPostitsByDate(updated);
        });
        return newPostit;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Errore nella creazione del postit');
      }
    },
    []
  );

  const updatePostitPosition = useCallback(
    async (id: number, x: number, y: number) => {
      try {
        // Trova il postit per ottenere il documentId se disponibile
        const postit = postits.find((p) => p.id === id);
        
        if (!postit) {
          console.warn(`[usePostits] Postit con id ${id} non trovato nell'array locale`);
          // Prova comunque l'update senza documentId, la funzione updatePostit lo recupererà
        } else {
          console.log(`[usePostits] Aggiornamento posizione postit ${id}, documentId: ${postit.documentId || 'non disponibile'}, nuova posizione: (${x}, ${y})`);
        }
        
        // Le coordinate vengono passate direttamente senza alcuna conversione
        const updatedPostit = await updatePostit(id, { X: x, Y: y }, postit?.documentId);
        
        console.log(`[usePostits] Posizione aggiornata con successo per postit ${id}`);
        
        // Aggiorna solo la posizione e i dati del postit senza riordinare l'array
        // Questo evita che cambino gli z-index di tutti i postit, causando sfarfallio
        setPostits((prev) => {
          return prev.map((p) => (p.id === id ? updatedPostit : p));
        });
        return updatedPostit;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
        console.error(`[usePostits] Errore nell'aggiornamento della posizione del postit ${id}:`, err);
        throw new Error(`Errore nell'aggiornamento della posizione del postit: ${errorMessage}`);
      }
    },
    [postits]
  );

  // Calcola lo z-index per ogni postit basato sul timestamp invece che sull'indice
  // Questo rende lo z-index stabile anche quando l'array non è ordinato
  const postitsWithZIndex = useMemo(() => {
    return postits.map((postit) => ({
      ...postit,
      zIndex: calculateZIndexFromTimestamp(postit, postits),
    }));
  }, [postits]);

  return {
    postits: postitsWithZIndex,
    loading,
    error,
    isOfflineMode,
    refetch: fetchPostits,
    addPostit,
    updatePostitPosition,
  };
}

