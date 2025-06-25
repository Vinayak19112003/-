"use client";

import { useState, useEffect, useCallback } from 'react';
import { type Trade } from '@/lib/types';

const STORAGE_KEY = 'tradevision-trades';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTrades = localStorage.getItem(STORAGE_KEY);
      if (storedTrades) {
        const parsedTrades = JSON.parse(storedTrades, (key, value) => {
          if (key === 'date' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        });
        setTrades(parsedTrades);
      }
    } catch (error) {
      console.error("Failed to load trades from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updateStorage = useCallback((updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrades));
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
