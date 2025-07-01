
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  DocumentData,
  onSnapshot
} from "firebase/firestore";
import { Trade, TradeSchema } from '@/lib/types';
import { useToast } from './use-toast';

const TRADES_COLLECTION = 'trades';

const convertDocToTrade = (doc: DocumentData): Trade => {
  const data = doc.data();
  const trade: Trade = {
    ...data,
    id: doc.id,
    date: (data.date as Timestamp).toDate(),
  };
  return TradeSchema.parse(trade);
};

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Database Connection Error',
        description: 'Could not connect to Firestore. Please check your Firebase setup.',
      });
      setIsLoaded(true);
      return;
    }

    const tradesCollection = collection(db, TRADES_COLLECTION);
    const q = query(tradesCollection, orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const tradesData = querySnapshot.docs.map(convertDocToTrade);
        setTrades(tradesData);
      } catch(error) {
        console.error("Error parsing trades:", error);
        toast({
          variant: "destructive",
          title: "Data Error",
          description: "Some trades could not be loaded due to invalid data.",
        });
      } finally {
        setIsLoaded(true);
      }
    }, (error) => {
      console.error("Error with trade snapshot listener:", error);
      toast({
        variant: "destructive",
        title: "Sync Error",
        description: "Could not sync trades from the database. Please refresh.",
      });
      setIsLoaded(true);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [toast]);
  
  const addTrade = async (trade: Trade) => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'Not connected to Firestore.' });
      return;
    }
    try {
      const newTrade = TradeSchema.parse(trade);
      const tradeData = {
        ...newTrade,
        date: Timestamp.fromDate(newTrade.date),
      };
      // remove id because it's managed by firestore
      const { id, ...tradeDataWithoutId } = tradeData;

      await addDoc(collection(db, TRADES_COLLECTION), tradeDataWithoutId);
    } catch (error) {
       console.error("Error adding trade:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the trade.",
      });
    }
  };

  const updateTrade = async (updatedTrade: Trade) => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'Not connected to Firestore.' });
      return;
    }
    try {
      const newTrade = TradeSchema.parse(updatedTrade);
      const tradeRef = doc(db, TRADES_COLLECTION, newTrade.id);
      const tradeData = {
        ...newTrade,
        date: Timestamp.fromDate(newTrade.date),
      };
      const { id, ...tradeDataWithoutId } = tradeData;
      
      await updateDoc(tradeRef, tradeDataWithoutId);
    } catch (error) {
      console.error("Error updating trade:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update the trade.",
      });
    }
  };
  
  const deleteTrade = async (id: string) => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'Not connected to Firestore.' });
      return;
    }
    try {
        const tradeRef = doc(db, TRADES_COLLECTION, id);
        await deleteDoc(tradeRef);
    } catch (error) {
        console.error("Error deleting trade:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the trade.",
        });
    }
  };

  return { trades, addTrade, updateTrade, deleteTrade, isLoaded };
}
