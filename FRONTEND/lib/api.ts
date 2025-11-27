import axios, { AxiosInstance } from 'axios';
import { getStoredToken, ensureAnonymousAuth, clearToken } from './auth';
import { Postit, PostitCreateData, PostitUpdateData } from '@/types/postit';
import { Comment, CommentCreateData } from '@/types/comment';
import { Settore } from '@/types/settore';
import { Tema } from '@/types/tema';
import { StrapiCollectionResponse, StrapiResponse } from '@/types/api';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://100.124.181.83:1337';

// Crea istanza axios con configurazione base
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: STRAPI_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor per aggiungere token JWT alle richieste
  client.interceptors.request.use(
    async (config) => {
      let token = getStoredToken();
      if (!token) {
        token = await ensureAnonymousAuth();
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Interceptor per gestire errori di autenticazione
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Ignora silenziosamente gli errori 403 su /api/users/me (chiamata automatica di Strapi)
      if (error.response?.status === 403 && error.config?.url?.includes('/api/users/me')) {
        // Restituisce una risposta vuota invece di rigettare l'errore
        return Promise.resolve({
          data: null,
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config: error.config,
        });
      }
      
      // Per gli endpoint dei commenti, se otteniamo 403 potrebbe essere un problema di permessi
      // Non ritentare automaticamente per evitare loop infiniti
      if (error.response?.status === 403 && error.config?.url?.includes('/api/comments')) {
        // Se abbiamo già un token e otteniamo ancora 403, è un problema di permessi
        // Non ritentare per evitare loop infiniti
        console.error('Errore 403 sui commenti - verifica i permessi nel backend');
        return Promise.reject(error);
      }
      
      // Se otteniamo un 401 (Unauthorized), proviamo a fare un nuovo login
      // Questo può succedere se il token è scaduto
      if (error.response?.status === 401) {
        // Evita retry infiniti: controlla se abbiamo già provato a rifare l'autenticazione per questa richiesta
        const retryKey = '__retryAttempted';
        if (error.config && (error.config as any)[retryKey]) {
          // Abbiamo già provato, non riprovare per evitare loop infiniti
          return Promise.reject(error);
        }
        
        // Pulisci il token vecchio
        clearToken();
        
        const newToken = await ensureAnonymousAuth();
        if (newToken && error.config) {
          // Marca questa richiesta come già ritentata
          (error.config as any)[retryKey] = true;
          // Riprova la richiesta con il nuovo token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return client.request(error.config);
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const api = createApiClient();

// API Settori
export async function getSettori(): Promise<Settore[]> {
  try {
    const response = await api.get<StrapiCollectionResponse<Settore>>(
      '/api/settori',
      {
        params: {
          publicationState: 'live',
          sort: 'NOME:asc',
        },
      }
    );
    console.log('[getSettori] Risposta API:', response.data);
    return response.data.data || [];
  } catch (error: any) {
    console.error('[getSettori] Errore:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// API Temi
export async function getTemi(): Promise<Tema[]> {
  try {
    const response = await api.get<StrapiCollectionResponse<Tema>>(
      '/api/temi',
      {
        params: {
          publicationState: 'live',
          sort: 'NOME:asc',
        },
      }
    );
    console.log('[getTemi] Risposta API:', response.data);
    return response.data.data || [];
  } catch (error: any) {
    console.error('[getTemi] Errore:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
}

// API Postit
export async function getPostits(): Promise<Postit[]> {
  const response = await api.get<StrapiCollectionResponse<Postit>>(
    '/api/postits',
    {
      params: {
        publicationState: 'live',
        sort: 'createdAt:desc',
        populate: ['settore', 'tema'],
      },
    }
  );
  // Assicuriamoci che documentId sia incluso nella risposta
  const postits = response.data.data.map((postit) => {
    // Se documentId non è presente, potrebbe essere necessario estrarlo dalla risposta
    // In Strapi 5, documentId dovrebbe essere sempre presente per contenuti pubblicati
    if (!postit.documentId && (postit as any).documentId) {
      return { ...postit, documentId: (postit as any).documentId };
    }
    return postit;
  });
  console.log(`[getPostits] Caricati ${postits.length} postit, documentId presenti: ${postits.filter(p => p.documentId).length}`);
  return postits;
}

export async function createPostit(data: PostitCreateData): Promise<Postit> {
  // Crea il postit
  const createResponse = await api.post<StrapiResponse<Postit>>('/api/postits', {
    data,
  });
  const postit = createResponse.data.data;

  // Pubblica automaticamente il postit
  try {
    await api.post(`/api/postits/${postit.id}/actions/publish`);
    // Ricarica il postit pubblicato per ottenere il publishedAt
    const publishedResponse = await api.get<StrapiResponse<Postit>>(
      `/api/postits/${postit.id}`
    );
    return publishedResponse.data.data;
  } catch (error) {
    // Se la pubblicazione fallisce, ritorna comunque il postit creato
    console.warn('Errore nella pubblicazione automatica del postit:', error);
    return postit;
  }
}

export async function updatePostit(id: number, data: PostitUpdateData, documentId?: string): Promise<Postit> {
  // In Strapi 5, per contenuti con draftAndPublish, è necessario usare documentId per gli update
  let identifier: number | string = id;
  
  // Se documentId non è fornito, proviamo a ottenerlo con una GET
  if (!documentId) {
    try {
      console.log(`[updatePostit] documentId non fornito, recupero per id ${id}`);
      const existingResponse = await api.get<StrapiResponse<Postit>>(`/api/postits/${id}`, {
        params: {
          publicationState: 'live',
        },
      });
      const existingPostit = existingResponse.data.data;
      if (existingPostit?.documentId) {
        identifier = existingPostit.documentId;
        console.log(`[updatePostit] documentId recuperato: ${identifier}`);
      } else {
        console.warn(`[updatePostit] documentId non trovato per id ${id}, uso id`);
      }
    } catch (error) {
      console.warn(`[updatePostit] Errore nel recupero del documentId per id ${id}:`, error);
      // Continua con id se il recupero fallisce
    }
  } else {
    identifier = documentId;
    console.log(`[updatePostit] Uso documentId fornito: ${identifier}`);
  }
  
  try {
    console.log(`[updatePostit] Tentativo update con identifier: ${identifier}`);
    const response = await api.put<StrapiResponse<Postit>>(`/api/postits/${identifier}`, {
      data,
    });
    const postit = response.data.data;

    // Pubblica automaticamente il postit solo se non è già pubblicato
    // Se publishedAt è null o undefined, significa che non è pubblicato
    if (!postit.publishedAt) {
      try {
        await api.post(`/api/postits/${identifier}/actions/publish`);
        // Ricarica il postit pubblicato per ottenere i dati aggiornati
        const publishedResponse = await api.get<StrapiResponse<Postit>>(
          `/api/postits/${identifier}`
        );
        console.log(`[updatePostit] Update e pubblicazione completati con successo`);
        return publishedResponse.data.data;
      } catch (error: any) {
        // Se la pubblicazione fallisce (es. 405 = già pubblicato), ritorna comunque il postit aggiornato
        if (error.response?.status === 405) {
          console.log(`[updatePostit] Postit già pubblicato, skip pubblicazione`);
        } else {
          console.warn('[updatePostit] Errore nella pubblicazione automatica del postit:', error);
        }
        return postit;
      }
    } else {
      // Postit già pubblicato, ritorna direttamente
      console.log(`[updatePostit] Postit già pubblicato, update completato`);
      return postit;
    }
  } catch (error: any) {
    // Se fallisce con documentId e abbiamo anche id, prova con id solo se identifier è diverso da id
    if (identifier !== id && typeof identifier === 'string') {
      console.warn(`[updatePostit] Update con documentId ${identifier} fallito, provo con id ${id}:`, error);
      try {
        const response = await api.put<StrapiResponse<Postit>>(`/api/postits/${id}`, {
          data,
        });
        const postit = response.data.data;

        // Pubblica solo se non è già pubblicato
        if (!postit.publishedAt) {
          try {
            await api.post(`/api/postits/${id}/actions/publish`);
            const publishedResponse = await api.get<StrapiResponse<Postit>>(
              `/api/postits/${id}`
            );
            console.log(`[updatePostit] Update completato con id come fallback`);
            return publishedResponse.data.data;
          } catch (publishError: any) {
            // Se la pubblicazione fallisce (es. 405 = già pubblicato), ritorna comunque il postit aggiornato
            if (publishError.response?.status === 405) {
              console.log(`[updatePostit] Postit già pubblicato (fallback), skip pubblicazione`);
            } else {
              console.warn('[updatePostit] Errore nella pubblicazione automatica del postit:', publishError);
            }
            return postit;
          }
        } else {
          console.log(`[updatePostit] Postit già pubblicato (fallback), update completato`);
          return postit;
        }
      } catch (idError) {
        console.error('[updatePostit] Errore anche con id come fallback:', idError);
        throw new Error(`Impossibile aggiornare il postit: ${error.response?.data?.error?.message || error.message}`);
      }
    }
    console.error('[updatePostit] Errore nell\'update:', error);
    throw new Error(`Impossibile aggiornare il postit: ${error.response?.data?.error?.message || error.message}`);
  }
}

// API Comments - Using native plugin comments API
/**
 * Get comments for a postit using the native plugin API
 * Returns comments in hierarchical structure with children
 * @param postitId - The ID or documentId of the postit
 */
export async function getCommentsForPostit(postitId: number | string): Promise<Comment[]> {
  // Il plugin comments espone l'endpoint: GET /api/comments/api::postit.postit:{documentId}
  // L'interceptor aggiunge automaticamente il token se necessario
  // Returns hierarchical structure directly (array, not wrapped in data)
  // Passa pagination[limit] per recuperare tutti i commenti (fino al maxLimit di 100)
  const response = await api.get<Comment[]>(
    `/api/comments/api::postit.postit:${postitId}`,
    {
      params: {
        'pagination[limit]': 100, // Usa il maxLimit per recuperare tutti i commenti possibili
      },
    }
  );
  // Plugin returns array directly for hierarchical structure
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Create a comment using the native plugin API
 * @param postitId - The ID or documentId of the postit
 * @param commentData - Comment data (content, threadOf, author, etc.)
 */
export async function createComment(
  postitId: number | string,
  commentData: Omit<CommentCreateData, 'related'>
): Promise<Comment> {
  // Use native plugin endpoint: POST /api/comments/api::postit.postit:{documentId}
  
  // Formatta il payload secondo la documentazione del plugin
  // Per utenti Strapi autenticati: basta inviare content e threadOf (opzionale)
  // Per utenti generici: serve anche l'oggetto author
  let token = getStoredToken();
  
  // Prepara il payload base
  const payload: any = {
    content: commentData.content,
  };
  
  // Aggiungi threadOf se presente
  if (commentData.threadOf !== undefined) {
    payload.threadOf = commentData.threadOf;
  }
  
  // Se l'utente ha fornito esplicitamente l'author, usalo
  // Altrimenti, se abbiamo un token (utente autenticato), NON inviare author
  // Il plugin prenderà l'autore dal contesto della richiesta JWT
  // Se non abbiamo token, fornisci un author generico per utenti anonimi
  if (commentData.author) {
    payload.author = commentData.author;
  } else if (!token) {
    // Nessun token - utente anonimo, fornisci author generico
    // Il ruolo Public ora può creare commenti senza autenticazione
    // Il plugin richiede un URL valido per avatar, usiamo un data URL placeholder
    payload.author = {
      id: 'anonymous',
      name: 'Anonimo',
      email: 'anonimo@example.com',
      avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNjY2MiLz48L3N2Zz4=', // Placeholder SVG come data URL
    };
  }
  // Se c'è token ma non author esplicito, inviamo solo content e threadOf
  // Il plugin prenderà l'autore dal contesto JWT
  
  // Non è più necessario autenticarsi per creare commenti anonimi
  // Il ruolo Public ora ha il permesso di creare commenti
  
  // Log per debug
  console.log('Creating comment with:', {
    endpoint: `/api/comments/api::postit.postit:${postitId}`,
    payload,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
  });
  
  try {
    // Se non c'è token, usa una chiamata axios diretta per evitare l'interceptor
    // che tenta automaticamente l'autenticazione anonima
    if (!token) {
      const directResponse = await axios.post<Comment>(
        `${STRAPI_URL}/api/comments/api::postit.postit:${postitId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return directResponse.data;
    }
    
    // Se c'è token, usa l'istanza api normale (con interceptor)
    const response = await api.post<Comment>(
      `/api/comments/api::postit.postit:${postitId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating comment:', {
      endpoint: `/api/comments/api::postit.postit:${postitId}`,
      payload,
      errorData: error.response?.data,
      errorMessage: error.response?.data?.error?.message || error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    });
    throw error;
  }
}

