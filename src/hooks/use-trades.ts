"use client";

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { Trade, TradeSchema } from '@/lib/types';

const STORAGE_KEY = 'tradevision-trades';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTrades = localStorage.getItem(STORAGE_KEY);
      if (storedTrades) {
        const rawTrades = JSON.parse(storedTrades);
        const parsedTrades = z.array(TradeSchema).parse(rawTrades);
        setTrades(parsedTrades);
      }
    } catch (error) {
      console.error("Failed to load or parse trades from localStorage. Old data might be incompatible.", error);
      // Optional: Clear storage if data is corrupt
      // localStorage.removeItem(STORAGE_KEY); 
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateStorage = useCallback((updatedTrades: Trade[]) => {
    // Sort by date descending before saving
    const sortedTrades = [...updatedTrades].sort((a, b) => b.date.getTime() - a.date.getTime());
    setTrades(sortedTrades);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedTrades));
    } catch (error) {
      console.error("Failed to save trades to localStorage", error);
    }
  }, []);

  const addTrade = useCallback((trade: Trade) => {
    const newTrades = [trade, ...trades];
    updateStorage(newTrades);
  }, [trades, updateStorage]);

  const updateTrade = useCallback((updatedTrade: Trade) => {
    const newTrades = trades.map(t => t.id === updatedTrade.id ? updatedTrade : t);
    updateStorage(newTrades);
  }, [trades, updateStorage]);
  
  const deleteTrade = useCallback((tradeId: string) => {
    const newTrades = trades.filter(t => t.id !== tradeId);
    updateStorage(newTrades);
  }, [trades, updateStorage]);

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
