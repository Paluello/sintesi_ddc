const ANONYMOUS_USERNAME = 'anonimo';
const ANONYMOUS_EMAIL = 'anonimo@example.com';
const ANONYMOUS_PASSWORD = 'anonimo'; // Password di default per account anonimo

const TOKEN_KEY = 'strapi_jwt_token';

export async function ensureAnonymousAuth(): Promise<string | null> {
  // Controlla se abbiamo già un token valido
  const existingToken = getStoredToken();
  if (existingToken) {
    // Se abbiamo un token, lo usiamo (non verifichiamo la validità per evitare errori 403)
    // Il token verrà validato automaticamente dalle richieste API
    return existingToken;
  }

  // Tenta il login con account anonimo
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: ANONYMOUS_USERNAME,
        password: ANONYMOUS_PASSWORD,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      storeToken(data.jwt);
      return data.jwt;
    }
  } catch (error) {
    console.error('Errore durante il login anonimo:', error);
  }

  // Se il login fallisce, l'account anonimo deve essere creato manualmente nel backend
  console.warn(
    'Account anonimo non trovato. Assicurati di aver creato un account con username "anonimo" nel backend Strapi.'
  );
  return null;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

