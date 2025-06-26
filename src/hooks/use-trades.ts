
"use client";

import useLocalStorage from './use-local-storage';
import { Trade, TradeSchema } from '@/lib/types';

const TRADES_STORAGE_KEY = 'trades';

export function useTrades() {
  const [trades, setTrades, isLoaded] = useLocalStorage<Trade[]>(TRADES_STORAGE_KEY, []);

  const addTrade = (trade: Trade) => {
    const newTrade = TradeSchema.parse(trade);
    setTrades(prev => [newTrade, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const updateTrade = (updatedTrade: Trade) => {
    const newTrade = TradeSchema.parse(updatedTrade);
    setTrades(prev => prev.map(t => (t.id === newTrade.id ? newTrade : t))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
