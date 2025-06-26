
"use client";

import { useCallback } from 'react';
import useLocalStorage from './use-local-storage';
import { Trade, TradeSchema } from '@/lib/types';

const TRADES_STORAGE_KEY = 'trades';

export function useTrades() {
  const [trades, setTrades, isLoaded] = useLocalStorage<Trade[]>(TRADES_STORAGE_KEY, []);

  const addTrade = useCallback((trade: Trade) => {
    const newTrade = TradeSchema.parse(trade);
    setTrades(prev => [newTrade, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [setTrades]);

  const updateTrade = useCallback((updatedTrade: Trade) => {
    const newTrade = TradeSchema.parse(updatedTrade);
    setTrades(prev => prev.map(t => (t.id === newTrade.id ? newTrade : t))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [setTrades]);

  return { trades, addTrade, updateTrade, isLoaded };
}
