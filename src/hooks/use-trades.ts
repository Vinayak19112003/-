
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
            console.warn("Filtering out invalid trade data from localStorage:", result.error.flatten());
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

  const updateTradesAndStorage = useCallback((updater: (trades: Trade[]) => Trade[]) => {
    setTrades(currentTrades => {
        const newTrades = updater(currentTrades);
        const sortedTrades = [...newTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedTrades));
        } catch (error) {
            console.error("Failed to save trades to localStorage", error);
        }
        return sortedTrades;
    });
  }, []);


  const addTrade = useCallback((trade: Trade) => {
    updateTradesAndStorage(currentTrades => [trade, ...currentTrades]);
  }, [updateTradesAndStorage]);

  const updateTrade = useCallback((updatedTrade: Trade) => {
    updateTradesAndStorage(currentTrades => currentTrades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
  }, [updateTradesAndStorage]);
  
  const deleteTrade = useCallback((tradeId: string) => {
    updateTradesAndStorage(currentTrades => currentTrades.filter(t => t.id !== tradeId));
  }, [updateTradesAndStorage]);

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
