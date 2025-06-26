
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Trade, TradeSchema } from '@/lib/types';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

const tradesCollection = collection(db, 'trades');

// Helper to convert Firestore data to our Trade type
const fromFirestore = (docSnapshot: any): Trade | null => {
  const data = docSnapshot.data();
  // Convert Firestore Timestamps to JS Dates
  const tradeDataWithDate = {
    ...data,
    id: docSnapshot.id,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
  };

  const result = TradeSchema.safeParse(tradeDataWithDate);
  if (result.success) {
    return result.data;
  }
  
  console.warn("Invalid trade data from Firestore, skipping:", result.error.flatten());
  return null;
};


export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set up a real-time listener on the trades collection
    const q = query(tradesCollection, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tradesData: Trade[] = [];
      querySnapshot.forEach((doc) => {
        const trade = fromFirestore(doc);
        if (trade) {
          tradesData.push(trade);
        }
      });
      setTrades(tradesData);
      if (!isLoaded) {
          setIsLoaded(true);
      }
    }, (error) => {
      console.error("Error fetching trades:", error);
      setIsLoaded(true); // Still set to loaded even if there's an error
    });

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [isLoaded]);

  const addTrade = useCallback(async (trade: Trade) => {
    try {
      const { id, ...tradeData } = TradeSchema.parse(trade);
      await addDoc(tradesCollection, tradeData);
    } catch (error) {
      console.error("Error adding trade:", error);
    }
  }, []);

  const updateTrade = useCallback(async (updatedTrade: Trade) => {
    try {
      const tradeRef = doc(db, 'trades', updatedTrade.id);
      const { id, ...tradeData } = TradeSchema.parse(updatedTrade);
      await updateDoc(tradeRef, tradeData);
    } catch (error) {
      console.error("Error updating trade:", error);
    }
  }, []);
  
  const deleteTrade = useCallback(async (tradeId: string) => {
    try {
      const tradeRef = doc(db, 'trades', tradeId);
      await deleteDoc(tradeRef);
    } catch (error) {
      console.error("Error deleting trade:", error);
    }
  }, []);

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
