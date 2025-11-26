export interface CommentAuthor {
  id: string | number;
  name: string;
  email: string;
  avatar: string | null;
}

export interface Comment {
  id: number;
  documentId?: string;
  content: string;
  blocked: boolean | null;
  blockedThread: boolean;
  blockReason: string | null;
  authorUser: number | null;
  removed: boolean | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
  related: string;
  threadOf: Comment | number | null;
  children?: Comment[];
  reports?: any[];
}

export interface CommentCreateData {
  content: string;
  related?: string; // Non necessario nell'URL per il plugin
  threadOf?: number; // ID del commento padre per le risposte
  author?: {
    id: string | number;
    name: string;
    email: string;
    avatar?: string;
  };
  locale?: string; // Per entità multi-lingua
}

