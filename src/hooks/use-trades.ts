
"use client";

import { useEffect, useState, useCallback } from 'react';
import useLocalStorage from './use-local-storage';
import { Trade, TradeSchema } from '@/lib/types';
import { z } from 'zod';

const TRADES_STORAGE_KEY = 'trades';

export function useTrades() {
  // `rawTrades` is the source of truth from localStorage
  const [rawTrades, setRawTrades, isStorageLoaded] = useLocalStorage<unknown[]>(TRADES_STORAGE_KEY, []);
  
  // `trades` is the validated and sorted state for the UI
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // This effect synchronizes and validates raw data from localStorage into the UI state
  useEffect(() => {
    if (isStorageLoaded) {
      const parsedTrades = z.array(TradeSchema.passthrough()).safeParse(rawTrades);
      
      if (parsedTrades.success) {
        // Filter out any trades that don't strictly match the final schema (e.g. after date coercion)
        const validTrades: Trade[] = parsedTrades.data
          .map(trade => {
            const finalCheck = TradeSchema.safeParse(trade);
            return finalCheck.success ? finalCheck.data : null;
          })
          .filter((t): t is Trade => t !== null)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTrades(validTrades);
      } else {
        console.error("Failed to parse trades from localStorage:", parsedTrades.error);
        setTrades([]); // Start with a clean slate if data is corrupt
      }
      setIsLoaded(true);
    }
  }, [rawTrades, isStorageLoaded]);


  const addTrade = useCallback((trade: Trade) => {
    const newTrade = TradeSchema.parse(trade);
    setRawTrades(prev => [newTrade, ...prev]);
  }, [setRawTrades]);

  const updateTrade = useCallback((updatedTrade: Trade) => {
    const newTrade = TradeSchema.parse(updatedTrade);
    setRawTrades(prev => prev.map(t => ((t as Trade).id === newTrade.id ? newTrade : t)));
  }, [setRawTrades]);

  const deleteTrade = useCallback((idToDelete: string) => {
    setRawTrades(prev => {
        let tradeFound = false;
        const updated = prev.filter(trade => {
            const t = trade as any; // Cast to any to check multiple ID properties
            const matches = (t.id === idToDelete) || (t._id === idToDelete) || (t.tradeID === idToDelete);
            if (matches) {
                tradeFound = true;
                return false;
            }
            return true;
        });

        if (tradeFound) {
            console.log(`deleteTrade: Queued deletion for trade with ID "${idToDelete}".`);
        } else {
            console.warn(`deleteTrade: Trade with ID "${idToDelete}" not found for deletion.`);
        }
        return updated;
    });
  }, [setRawTrades]);

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
