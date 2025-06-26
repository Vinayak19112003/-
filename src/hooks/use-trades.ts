
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeSchema } from '@/lib/types';
import { z } from 'zod';

const TRADES_STORAGE_KEY = 'trades';

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load trades from localStorage on initial render
  useEffect(() => {
    try {
      const storedTrades = localStorage.getItem(TRADES_STORAGE_KEY);
      if (storedTrades) {
        const rawTrades = JSON.parse(storedTrades);
        // Safely parse each trade and filter out invalid ones
        const parsedTrades: Trade[] = rawTrades.map((trade: any) => {
            const result = TradeSchema.safeParse(trade);
            return result.success ? result.data : null;
          }).filter((trade: Trade | null): trade is Trade => trade !== null);
          
        setTrades(parsedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error("Failed to load or parse trades from localStorage:", error);
      // If parsing fails, it's safer to start with an empty list
      setTrades([]);
    }
    setIsLoaded(true);
  }, []);

  // Save trades to localStorage whenever they change
  useEffect(() => {
    if(isLoaded) {
      localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    }
  }, [trades, isLoaded]);

  const addTrade = useCallback((trade: Trade) => {
    const newTrade = TradeSchema.parse(trade);
    setTrades(prevTrades => 
      [newTrade, ...prevTrades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    return Promise.resolve();
  }, []);

  const updateTrade = useCallback((updatedTrade: Trade) => {
    const newTrade = TradeSchema.parse(updatedTrade);
    setTrades(prevTrades =>
      prevTrades.map(t => (t.id === newTrade.id ? newTrade : t))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    return Promise.resolve();
  }, []);
  
  const deleteTrade = useCallback((tradeId: string) => {
    setTrades(prevTrades => prevTrades.filter(t => t.id !== tradeId));
    return Promise.resolve();
  }, []);

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
