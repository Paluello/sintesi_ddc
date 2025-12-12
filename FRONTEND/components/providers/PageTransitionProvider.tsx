'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PageTransitionContextType {
  isTransitioning: boolean;
  targetPath: string | null;
  startTransition: (path: string) => void;
  completeTransition: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  const startTransition = (path: string) => {
    // Ignora se già in transizione
    if (isTransitioning) return;
    
    setTargetPath(path);
    setIsTransitioning(true);
  };

  const completeTransition = () => {
    setIsTransitioning(false);
    setTargetPath(null);
  };

  return (
    <PageTransitionContext.Provider 
      value={{ 
        isTransitioning, 
        targetPath, 
        startTransition, 
        completeTransition 
      }}
    >
      {children}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
}
