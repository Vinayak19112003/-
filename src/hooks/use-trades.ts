
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
        // The error is because previously stored trades might not match the new, stricter schema.
        // We will safely parse each trade and only keep the valid ones.
        const validTrades = rawTrades
          .map((trade: unknown) => {
            const result = TradeSchema.safeParse(trade);
            if (result.success) {
              return result.data;
            }
            console.warn("Filtering out invalid trade data from localStorage:", result.error);
            return null;
          })
          .filter((trade: Trade | null): trade is Trade => trade !== null);

        setTrades(validTrades);
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
    const sortedTrades = [...updatedTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
