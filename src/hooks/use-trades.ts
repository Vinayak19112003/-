
"use client";

import { useState, useEffect } from 'react';
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
          
        setTrades(parsedTrades);
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

  const addTrade = (trade: Trade) => {
    setTrades(prevTrades => {
        const newTrade = TradeSchema.parse(trade);
        const updatedTrades = [newTrade, ...prevTrades];
        updatedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return updatedTrades;
    });
  };

  const updateTrade = (updatedTrade: Trade) => {
    setTrades(prevTrades => {
        const newTrade = TradeSchema.parse(updatedTrade);
        const updatedTrades = prevTrades.map(t => (t.id === newTrade.id ? newTrade : t));
        updatedTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return updatedTrades;
    });
  };
  
  const deleteTrade = (idToDelete: string) => {
    setTrades(currentTrades => {
      let tradeFound = false;
      const updatedTrades = currentTrades.filter(trade => {
        // Check for various possible ID keys.
        const matches = (trade.id === idToDelete) || 
                        ((trade as any)._id === idToDelete) || 
                        ((trade as any).tradeID === idToDelete);
        
        if (matches) {
          tradeFound = true;
          return false; // Exclude this item from the new array
        }
        return true; // Keep this item
      });
  
      if (tradeFound) {
        console.log(`deleteTrade: Successfully deleted trade with ID "${idToDelete}".`);
      } else {
        console.log(`deleteTrade: Trade with ID "${idToDelete}" not found.`);
      }
  
      // Return the updated array to set the new state.
      // The `useEffect` hook will then automatically save this new array to localStorage.
      return updatedTrades;
    });
  };

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
