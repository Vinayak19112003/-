
'use client';

import { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface StreamerModeContextType {
  isStreamerMode: boolean;
  toggleStreamerMode: () => void;
}

const StreamerModeContext = createContext<StreamerModeContextType | undefined>(undefined);

export function StreamerModeProvider({ children }: { children: ReactNode }) {
  const [isStreamerMode, setIsStreamerMode] = useState(false);

  const toggleStreamerMode = () => {
    setIsStreamerMode(prev => !prev);
  };

  const value = useMemo(() => ({ isStreamerMode, toggleStreamerMode }), [isStreamerMode]);

  return (
    <StreamerModeContext.Provider value={value}>
      {children}
    </StreamerModeContext.Provider>
  );
}

export function useStreamerMode() {
  const context = useContext(StreamerModeContext);
  if (context === undefined) {
    throw new Error('useStreamerMode must be used within a StreamerModeProvider');
  }
  return context;
}
