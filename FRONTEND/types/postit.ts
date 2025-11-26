export type PostitStyle = 'a' | 'b' | 'c' | 'd';

export interface Postit {
  id: number;
  documentId?: string; // documentId per Strapi 5 - necessario per il plugin comments
  TITOLO: string;
  TESTO: string;
  X?: number | null;
  Y?: number | null;
  STILE?: PostitStyle | null;
  settore?: {
    id: number;
    NOME: string;
  } | null;
  tema?: {
    id: number;
    NOME: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  zIndex?: number; // z-index calcolato in base alla data di modifica/creazione
}

export interface PostitCreateData {
  TITOLO: string;
  TESTO: string;
  X?: number;
  Y?: number;
  STILE?: PostitStyle;
  settore?: number | null;
  tema?: number | null;
}

export interface PostitUpdateData {
  TITOLO?: string;
  TESTO?: string;
  X?: number;
  Y?: number;
  STILE?: PostitStyle;
  settore?: number | null;
  tema?: number | null;
}

