
"use client";

import { useState, useEffect, useCallback } from 'react';
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
  writeBatch,
  getDocs,
  limit
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

  const getTradesCollectionRef = useCallback(() => {
    if (!user || !db) return null;
    return collection(db, 'users', user.uid, TRADES_COLLECTION);
  }, [user]);

  // Fetch initial data once
  useEffect(() => {
    const fetchTrades = async () => {
      const tradesCollection = getTradesCollectionRef();
      if (!tradesCollection) {
        setIsLoaded(true);
        return;
      }

      setIsLoaded(false);
      try {
        const q = query(tradesCollection, orderBy("date", "desc"), limit(100));
        const querySnapshot = await getDocs(q);
        const tradesData = querySnapshot.docs.map(convertDocToTrade);
        setTrades(tradesData);
      } catch (error) {
        console.error("Error fetching trades:", error);
        toast({
          variant: "destructive",
          title: "Data Error",
          description: "Could not load trades.",
        });
      } finally {
        setIsLoaded(true);
      }
    };

    if (user) {
      fetchTrades();
    } else {
      setTrades([]);
      setIsLoaded(true);
    }
  }, [user, getTradesCollectionRef, toast]);
  
  const addTrade = async (trade: Trade) => {
    const tradesCollection = getTradesCollectionRef();
    if (!tradesCollection) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add a trade.' });
      throw new Error("User not authenticated");
    }

    try {
      const newTrade = TradeSchema.parse(trade);
      const tradeData = {
        ...newTrade,
        date: Timestamp.fromDate(newTrade.date),
      };
      const { id, ...tradeDataWithoutId } = tradeData;

      const docRef = await addDoc(tradesCollection, tradeDataWithoutId);
      
      const tradeWithId = { ...newTrade, id: docRef.id };
      setTrades(prevTrades => [tradeWithId, ...prevTrades].sort((a, b) => b.date.getTime() - a.date.getTime()));

    } catch (error) {
       console.error("Error adding trade:", error);
       toast({
        variant: "destructive",
        title: "Error Saving Trade",
        description: "Could not save the trade.",
      });
      throw error;
    }
  };

  const addMultipleTrades = async (tradesToImport: Trade[]) => {
    const tradesCollection = getTradesCollectionRef();
    if (!tradesCollection) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to import trades.' });
      throw new Error("User not authenticated");
    }
    if (tradesToImport.length > 499) {
        toast({ variant: 'destructive', title: 'Import Limit Exceeded', description: 'You can import a maximum of 499 trades at a time.' });
        throw new Error("Import limit exceeded");
    }

    const batch = writeBatch(db);
    const locallyAddedTrades: Trade[] = [];
    
    tradesToImport.forEach(trade => {
        const docRef = doc(tradesCollection);
        const tradeData = {
            ...trade,
            id: docRef.id,
            date: Timestamp.fromDate(new Date(trade.date)),
        };
        
        const validatedTrade = TradeSchema.parse(tradeData);
        locallyAddedTrades.push(validatedTrade);
        const { id, ...tradeDataWithoutId } = validatedTrade;
        batch.set(docRef, { ...tradeDataWithoutId, date: tradeData.date });
    });

    try {
        await batch.commit();
        setTrades(prevTrades => [...locallyAddedTrades, ...prevTrades].sort((a,b) => b.date.getTime() - a.date.getTime()));
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
    const tradesCollection = getTradesCollectionRef();
     if (!tradesCollection) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to update a trade.' });
      throw new Error("User not authenticated");
    }
    
    try {
      const newTrade = TradeSchema.parse(updatedTrade);
      const tradeRef = doc(db, 'users', user!.uid, TRADES_COLLECTION, newTrade.id);
      const tradeData = {
        ...newTrade,
        date: Timestamp.fromDate(newTrade.date),
      };
      const { id, ...tradeDataWithoutId } = tradeData;
      
      await updateDoc(tradeRef, tradeDataWithoutId);
      
      setTrades(prevTrades => prevTrades.map(t => t.id === newTrade.id ? newTrade : t).sort((a,b) => b.date.getTime() - a.date.getTime()));

    } catch (error) {
      console.error("Error updating trade:", error);
      toast({
        variant: "destructive",
        title: "Error Updating Trade",
        description: "Could not update the trade.",
      });
      throw error;
    }
  };
  
  const deleteTrade = async (id: string) => {
     const tradesCollection = getTradesCollectionRef();
     if (!tradesCollection) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to delete a trade.' });
      throw new Error("User not authenticated");
    }
    
    try {
        const tradeRef = doc(db, 'users', user!.uid, TRADES_COLLECTION, id);
        await deleteDoc(tradeRef);
        
        setTrades(prevTrades => prevTrades.filter(t => t.id !== id));

    } catch (error) {
        console.error("Error deleting trade:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the trade.",
        });
    }
  };

  const deleteAllTrades = async () => {
    const tradesCollection = getTradesCollectionRef();
     if (!tradesCollection) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to delete trades.' });
      return;
    }

    try {
      const q = query(tradesCollection);
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast({ title: 'No Trades to Delete', description: 'Your trade log is already empty.' });
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      setTrades([]);

      toast({
        title: "All Trades Deleted",
        description: "Your trade log has been cleared.",
      });
    } catch (error) {
      console.error("Error deleting all trades:", error);
      toast({
        variant: "destructive",
        title: "Error Deleting Trades",
        description: "Could not clear the trade log.",
      });
    }
  };

  return { trades, addTrade, updateTrade, addMultipleTrades, deleteTrade, deleteAllTrades, isLoaded };
}
