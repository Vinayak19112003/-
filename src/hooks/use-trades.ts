
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
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { Trade, TradeSchema } from '@/lib/types';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

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
  const { user } = useAuth();
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
    
    if (!user) {
      setTrades([]);
      setIsLoaded(true); // If no user, there are no trades to load
      return;
    }

    const tradesCollection = collection(db, 'users', user.uid, TRADES_COLLECTION);
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

    return () => unsubscribe();
  }, [toast, user]);
  
  const addTrade = async (trade: Trade) => {
    if (!db || !user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add a trade.' });
      return;
    }
    try {
      const newTrade = TradeSchema.parse(trade);
      const tradeData = {
        ...newTrade,
        date: Timestamp.fromDate(newTrade.date),
      };
      const { id, ...tradeDataWithoutId } = tradeData;

      await addDoc(collection(db, 'users', user.uid, TRADES_COLLECTION), tradeDataWithoutId);
    } catch (error) {
       console.error("Error adding trade:", error);
       toast({
        variant: "destructive",
        title: "Error Saving Trade",
        description: "Could not save the trade. Check permissions or network.",
      });
      throw error;
    }
  };

  const addMultipleTrades = async (tradesToImport: Trade[]) => {
    if (!db || !user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to import trades.' });
      throw new Error("User not authenticated");
    }
    if (tradesToImport.length > 499) {
        toast({ variant: 'destructive', title: 'Import Limit Exceeded', description: 'You can import a maximum of 499 trades at a time.' });
        throw new Error("Import limit exceeded");
    }

    const batch = writeBatch(db);
    const tradesCollectionRef = collection(db, 'users', user.uid, TRADES_COLLECTION);
    
    tradesToImport.forEach(trade => {
        const docRef = doc(tradesCollectionRef); // Firestore will generate an ID
        const tradeData = {
            ...trade,
            date: Timestamp.fromDate(new Date(trade.date)),
        };
        const { id, ...tradeDataWithoutId } = tradeData;
        batch.set(docRef, tradeDataWithoutId);
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error importing trades:", error);
        toast({
            variant: "destructive",
            title: "Error Importing Trades",
            description: "Could not save the imported trades.",
        });
        throw error;
    }
  };

  const updateTrade = async (updatedTrade: Trade) => {
    if (!db || !user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to update a trade.' });
      return;
    }
    try {
      const newTrade = TradeSchema.parse(updatedTrade);
      const tradeRef = doc(db, 'users', user.uid, TRADES_COLLECTION, newTrade.id);
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
        title: "Error Updating Trade",
        description: "Could not update the trade. Check permissions or network.",
      });
      throw error;
    }
  };
  
  const deleteTrade = async (id: string) => {
    if (!db || !user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to delete a trade.' });
      return;
    }
    try {
        const tradeRef = doc(db, 'users', user.uid, TRADES_COLLECTION, id);
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

  return { trades, addTrade, updateTrade, addMultipleTrades, deleteTrade, isLoaded };
}
