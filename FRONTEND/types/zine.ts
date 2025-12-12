export interface StrapiMedia {
  id: number;
  url: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
  };
  mime?: string;
  size?: number;
  name?: string;
}

export interface Zine {
  id: number;
  documentId?: string;
  IMMAGINE?: StrapiMedia | null;
  SVG?: StrapiMedia | null;
  DESCRIZIONE?: string | null;
  FILE?: StrapiMedia | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
