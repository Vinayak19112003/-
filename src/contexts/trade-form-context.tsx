
'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Trade } from '@/lib/types';

interface TradeFormContextType {
  openForm: (trade?: Trade) => void;
}

const TradeFormContext = createContext<TradeFormContextType | undefined>(undefined);

export function useTradeForm() {
  const context = useContext(TradeFormContext);
  if (!context) {
    throw new Error('useTradeForm must be used within a TradeForm provider in the layout.');
  }
  return context;
}

export function TradeFormProvider({ 
  value, 
  children 
}: { 
  value: TradeFormContextType; 
  children: React.ReactNode; 
}) {
  const memoizedValue = useMemo(() => value, [value.openForm]);
  
  return (
    <TradeFormContext.Provider value={memoizedValue}>
      {children}
    </TradeFormContext.Provider>
  );
}
