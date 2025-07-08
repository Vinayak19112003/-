
'use client';

import { createContext, useContext } from 'react';
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

export const TradeFormProvider = TradeFormContext.Provider;
