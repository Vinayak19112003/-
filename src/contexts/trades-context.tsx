'use client';

import { createContext, useState, useCallback, useContext, useMemo, useEffect, type ReactNode } from 'react';
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
} from "firebase/firestore";
import { Trade, TradeSchema } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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

interface TradesContextType {
    trades: Trade[];
    isLoading: boolean;
    isLoaded: boolean;
    refetchTrades: () => Promise<void>;
    addTrade: (trade: Omit<Trade, 'id'>) => Promise<boolean>;
    addMultipleTrades: (newTrades: Omit<Trade, 'id'>[]) => Promise<{success: boolean, addedCount: number}>;
    updateTrade: (trade: Trade) => Promise<boolean>;
    deleteTrade: (id: string) => Promise<boolean>;
    deleteAllTrades: () => Promise<boolean>;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const getTradesCollectionRef = useCallback(() => {
        if (!user || !db) return null;
        return collection(db, 'users', user.uid, TRADES_COLLECTION);
    }, [user]);

    const refetchTrades = useCallback(async () => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) {
            setIsLoaded(true);
            return;
        }

        setIsLoading(true);
        try {
            const q = query(tradesCollection, orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedTrades = querySnapshot.docs.map(convertDocToTrade);
            setTrades(fetchedTrades);
        } catch (error) {
            console.error("Error fetching trades:", error);
            toast({ variant: "destructive", title: "Data Error", description: "Could not load trades." });
        } finally {
            setIsLoading(false);
            setIsLoaded(true);
        }
    }, [getTradesCollectionRef, toast]);

    useEffect(() => {
        if (user && !isLoaded) {
            refetchTrades();
        } else if (!user) {
            setTrades([]);
            setIsLoaded(true);
        }
    }, [user, isLoaded, refetchTrades]);

    const addTrade = useCallback(async (trade: Omit<Trade, 'id'>) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        try {
            const newDocRef = doc(tradesCollection);
            const newTrade = { ...trade, id: newDocRef.id };
            await addDoc(tradesCollection, {
                ...trade,
                date: Timestamp.fromDate(trade.date),
            });
            // Add to local state
            setTrades(prev => [newTrade, ...prev].sort((a,b) => b.date.getTime() - a.date.getTime()));
            return true;
        } catch (error) {
            console.error("Error adding trade:", error);
            toast({ variant: "destructive", title: "Error Saving Trade", description: "Could not save the trade." });
            return false;
        }
    }, [getTradesCollectionRef, toast]);

    const addMultipleTrades = useCallback(async (newTrades: Omit<Trade, 'id'>[]) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection || newTrades.length === 0) return { success: false, addedCount: 0 };

        try {
            const batch = writeBatch(db);
            const tradesToAddLocally: Trade[] = [];

            newTrades.forEach(trade => {
                const docRef = doc(tradesCollection);
                batch.set(docRef, { ...trade, date: Timestamp.fromDate(trade.date) });
                tradesToAddLocally.push({ ...trade, id: docRef.id });
            });

            await batch.commit();

            setTrades(prev => [...tradesToAddLocally, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));

            return { success: true, addedCount: newTrades.length };
        } catch (error) {
            console.error("Error batch adding trades:", error);
            toast({ variant: "destructive", title: "Import Error", description: "Could not save the imported trades." });
            return { success: false, addedCount: 0 };
        }
    }, [getTradesCollectionRef, toast]);

    const updateTrade = useCallback(async (trade: Trade) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        try {
            const tradeRef = doc(tradesCollection, trade.id);
            const { id, ...tradeData } = trade;
            await updateDoc(tradeRef, {
                ...tradeData,
                date: Timestamp.fromDate(trade.date),
            });
            // Update local state
            setTrades(prev => prev.map(t => t.id === id ? trade : t).sort((a,b) => b.date.getTime() - a.date.getTime()));
            return true;
        } catch (error) {
            console.error("Error updating trade:", error);
            toast({ variant: "destructive", title: "Error Updating Trade", description: "Could not update the trade." });
            return false;
        }
    }, [getTradesCollectionRef, toast]);

    const deleteTrade = useCallback(async (id: string) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        try {
            await deleteDoc(doc(tradesCollection, id));
            setTrades(prev => prev.filter(t => t.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting trade:", error);
            toast({ variant: "destructive", title: "Error Deleting Trade", description: "Could not delete the trade." });
            return false;
        }
    }, [getTradesCollectionRef, toast]);

    const deleteAllTrades = useCallback(async () => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        try {
            const q = query(tradesCollection);
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            setTrades([]);
            return true;
        } catch (error) {
            console.error("Error deleting all trades:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not clear trade log." });
            return false;
        }
    }, [getTradesCollectionRef, toast]);

    const value = useMemo(() => ({
        trades,
        isLoading,
        isLoaded,
        refetchTrades,
        addTrade,
        addMultipleTrades,
        updateTrade,
        deleteTrade,
        deleteAllTrades,
    }), [trades, isLoading, isLoaded, refetchTrades, addTrade, addMultipleTrades, updateTrade, deleteTrade, deleteAllTrades]);

    return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export const useTrades = (): TradesContextType => {
    const context = useContext(TradesContext);
    if (!context) {
        throw new Error('useTrades must be used within a TradesProvider');
    }
    return context;
};