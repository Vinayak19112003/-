
'use client';

import { createContext, useState, useCallback, useContext, useMemo, type ReactNode } from 'react';
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
  limit,
  where,
  startAfter,
  QueryDocumentSnapshot,
  DocumentSnapshot,
} from "firebase/firestore";
import type { DateRange } from "react-day-picker";
import { Trade, TradeSchema } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const TRADES_COLLECTION = 'trades';
const PAGE_SIZE = 20;

const convertDocToTrade = (doc: DocumentData): Trade => {
  const data = doc.data();
  const trade: Trade = {
    ...data,
    id: doc.id,
    date: (data.date as Timestamp).toDate(),
  };
  return TradeSchema.parse(trade);
};

type FetchOptions = {
    dateRange?: DateRange;
    sortBy?: keyof Trade;
    sortDirection?: 'asc' | 'desc';
    newQuery?: boolean;
};

interface TradesContextType {
    trades: Trade[];
    isLoading: boolean;
    hasMore: boolean;
    fetchTrades: (options?: FetchOptions) => Promise<void>;
    loadMoreTrades: () => Promise<void>;
    addTrade: (trade: Omit<Trade, 'id'>) => Promise<boolean>;
    updateTrade: (trade: Trade) => Promise<boolean>;
    deleteTrade: (id: string) => Promise<boolean>;
    deleteAllTrades: () => Promise<boolean>;
    isLoaded: boolean;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [lastQueryOptions, setLastQueryOptions] = useState<FetchOptions>({});

    const getTradesCollectionRef = useCallback(() => {
        if (!user || !db) return null;
        return collection(db, 'users', user.uid, TRADES_COLLECTION);
    }, [user]);

    const fetchTrades = useCallback(async (options: FetchOptions = {}) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) {
            setIsLoaded(true);
            return;
        }

        setIsLoading(true);
        setLastQueryOptions(options); // Save options for loadMore

        try {
            const constraints = [];
            
            // Filtering
            if (options.dateRange?.from) {
                constraints.push(where("date", ">=", Timestamp.fromDate(options.dateRange.from)));
            }
            if (options.dateRange?.to) {
                const toDate = new Date(options.dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                constraints.push(where("date", "<=", Timestamp.fromDate(toDate)));
            }

            // Sorting
            constraints.push(orderBy(options.sortBy || 'date', options.sortDirection || 'desc'));
            
            // Pagination
            constraints.push(limit(PAGE_SIZE));

            const q = query(tradesCollection, ...constraints);
            const querySnapshot = await getDocs(q);
            
            const fetchedTrades = querySnapshot.docs.map(convertDocToTrade);
            setTrades(fetchedTrades);

            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc || null);
            setHasMore(querySnapshot.docs.length === PAGE_SIZE);

        } catch (error) {
            console.error("Error fetching trades:", error);
            toast({ variant: "destructive", title: "Data Error", description: "Could not load trades." });
        } finally {
            setIsLoading(false);
            setIsLoaded(true);
        }
    }, [getTradesCollectionRef, toast]);

    const loadMoreTrades = useCallback(async () => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection || !lastVisible || !hasMore) return;
        
        setIsLoading(true);
        
        try {
            const constraints = [];
            if (lastQueryOptions.dateRange?.from) constraints.push(where("date", ">=", Timestamp.fromDate(lastQueryOptions.dateRange.from)));
            if (lastQueryOptions.dateRange?.to) {
                const toDate = new Date(lastQueryOptions.dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                constraints.push(where("date", "<=", Timestamp.fromDate(toDate)));
            }
            constraints.push(orderBy(lastQueryOptions.sortBy || 'date', lastQueryOptions.sortDirection || 'desc'));
            constraints.push(startAfter(lastVisible));
            constraints.push(limit(PAGE_SIZE));

            const q = query(tradesCollection, ...constraints);
            const querySnapshot = await getDocs(q);

            const newTrades = querySnapshot.docs.map(convertDocToTrade);
            setTrades(prev => [...prev, ...newTrades]);

            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(lastDoc || null);
            setHasMore(querySnapshot.docs.length === PAGE_SIZE);

        } catch (error) {
            console.error("Error loading more trades:", error);
            toast({ variant: "destructive", title: "Load More Error", description: "Could not load more trades." });
        } finally {
            setIsLoading(false);
        }
    }, [getTradesCollectionRef, lastVisible, hasMore, lastQueryOptions, toast]);
    
    const addTrade = async (trade: Omit<Trade, 'id'>) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        try {
            await addDoc(tradesCollection, {
                ...trade,
                date: Timestamp.fromDate(trade.date),
            });
            await fetchTrades(lastQueryOptions); // Refetch to show the new trade
            return true;
        } catch (error) {
            console.error("Error adding trade:", error);
            toast({ variant: "destructive", title: "Error Saving Trade", description: "Could not save the trade." });
            return false;
        }
    };
    
    const updateTrade = async (trade: Trade) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        try {
            const tradeRef = doc(tradesCollection, trade.id);
            const { id, ...tradeData } = trade;
            await updateDoc(tradeRef, {
                ...tradeData,
                date: Timestamp.fromDate(trade.date),
            });
            await fetchTrades(lastQueryOptions); // Refetch to show updates
            return true;
        } catch (error) {
            console.error("Error updating trade:", error);
            toast({ variant: "destructive", title: "Error Updating Trade", description: "Could not update the trade." });
            return false;
        }
    };

    const deleteTrade = async (id: string) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        try {
            await deleteDoc(doc(tradesCollection, id));
            await fetchTrades(lastQueryOptions); // Refetch
            return true;
        } catch (error) {
            console.error("Error deleting trade:", error);
            toast({ variant: "destructive", title: "Error Deleting Trade", description: "Could not delete the trade." });
            return false;
        }
    };

    const deleteAllTrades = async () => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;
        
        try {
            const q = query(tradesCollection);
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            setTrades([]); // Clear local state
            setHasMore(false);
            setLastVisible(null);
            return true;
        } catch (error) {
            console.error("Error deleting all trades:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not clear trade log." });
            return false;
        }
    };

    const value = useMemo(() => ({
        trades,
        isLoading,
        hasMore,
        fetchTrades,
        loadMoreTrades,
        addTrade,
        updateTrade,
        deleteTrade,
        deleteAllTrades,
        isLoaded,
    }), [trades, isLoading, hasMore, fetchTrades, loadMoreTrades, isLoaded]);

    return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export const useTrades = (): TradesContextType => {
    const context = useContext(TradesContext);
    if (!context) {
        throw new Error('useTrades must be used within a TradesProvider');
    }
    return context;
};
