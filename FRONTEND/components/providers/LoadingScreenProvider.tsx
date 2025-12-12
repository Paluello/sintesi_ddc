'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingScreenContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const LoadingScreenContext = createContext<LoadingScreenContextType | undefined>(undefined);

export function LoadingScreenProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <LoadingScreenContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </LoadingScreenContext.Provider>
  );
}

export function useLoadingScreen() {
  const context = useContext(LoadingScreenContext);
  if (context === undefined) {
    throw new Error('useLoadingScreen must be used within a LoadingScreenProvider');
  }
  return context;
}
