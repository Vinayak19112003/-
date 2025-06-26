
"use client";

import { useMemo } from 'react';
import useLocalStorage from './use-local-storage';
import { Trade, TradeSchema } from '@/lib/types';

const TRADES_STORAGE_KEY = 'trades';

export function useTrades() {
  const [storedTrades, setStoredTrades, isLoaded] = useLocalStorage<Trade[]>(TRADES_STORAGE_KEY, []);

  // Dates are stored as strings in localStorage. We need to convert them back to Date objects.
  const trades = useMemo(() => {
    if (!isLoaded) {
      return [];
    }
    return storedTrades.map(trade => ({
      ...trade,
      date: new Date(trade.date),
    }));
  }, [storedTrades, isLoaded]);

  const addTrade = (trade: Trade) => {
    const newTrade = TradeSchema.parse(trade);
    setStoredTrades(prev => [newTrade, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const updateTrade = (updatedTrade: Trade) => {
    const newTrade = TradeSchema.parse(updatedTrade);
    setStoredTrades(prev => prev.map(t => (t.id === newTrade.id ? newTrade : t))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const deleteTrade = (id: string) => {
    setStoredTrades(prev => prev.filter(t => t.id !== id));
  };

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
