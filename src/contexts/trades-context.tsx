
'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
  getDocs,
  query,
  runTransaction,
  where,
  orderBy,
  CollectionReference
} from "firebase/firestore";
import { Trade } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useAccountContext } from './account-context';

const TRADES_COLLECTION = 'trades';
const ACCOUNTS_COLLECTION = 'settings';
const ACCOUNTS_DOC_ID = 'userConfig'; 

interface TradesContextType {
    allTrades: Trade[];
    isTradesLoading: boolean;
    addTrade: (trade: Omit<Trade, 'id'>) => Promise<boolean>;
    addMultipleTrades: (newTrades: Omit<Trade, 'id'>[]) => Promise<{success: boolean, addedCount: number}>;
    updateTrade: (trade: Trade) => Promise<boolean>;
    deleteTrade: (id: string) => Promise<boolean>;
    deleteAllTrades: (accountId: string) => Promise<boolean>;
    refreshKey: number;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { selectedAccountId, isAccountsLoaded } = useAccountContext();

    const [allTrades, setAllTrades] = useState<Trade[]>([]);
    const [isTradesLoading, setIsTradesLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => setRefreshKey(prev => prev + 1);

    useEffect(() => {
        const fetchAllTrades = async () => {
            if (!user || !selectedAccountId || !isAccountsLoaded) {
                // If we don't have what we need, set loading to false and clear trades.
                if(!selectedAccountId && isAccountsLoaded) {
                    setAllTrades([]);
                    setIsTradesLoading(false);
                }
                return;
            };

            setIsTradesLoading(true);
            try {
                const tradesCollection = collection(db, 'users', user.uid, 'trades') as CollectionReference<Trade>;
                const q = query(tradesCollection, where('accountId', '==', selectedAccountId), orderBy('date', 'asc'));
                
                const querySnapshot = await getDocs(q);
                const fetchedTrades = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, date: (doc.data().date as unknown as Timestamp).toDate() })) as Trade[];
                setAllTrades(fetchedTrades);

            } catch (error: any) {
                 if (error.code === 'failed-precondition') {
                    console.error("Firebase Index Required:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Firebase Index Required',
                        description: 'Please create the required Firestore index by clicking the link in the console error.',
                        duration: 10000,
                    });
                } else {
                    console.error("Error fetching trades:", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not fetch trade data."
                    });
                }
            } finally {
                setIsTradesLoading(false);
            }
        };

        fetchAllTrades();
    // Re-fetch whenever the user, account, or refreshKey changes.
    }, [user, selectedAccountId, isAccountsLoaded, refreshKey, toast]);


    const getTradesCollectionRef = useCallback(() => {
        if (!user || !db) return null;
        return collection(db, 'users', user.uid, TRADES_COLLECTION);
    }, [user]);

    const getAccountsDocRef = useCallback(() => {
        if (!user || !db) return null;
        return doc(db, 'users', user.uid, ACCOUNTS_COLLECTION, ACCOUNTS_DOC_ID);
    }, [user]);

    const addTrade = useCallback(async (trade: Omit<Trade, 'id'>) => {
        const tradesCollection = getTradesCollectionRef();
        const accountsDocRef = getAccountsDocRef();
        if (!tradesCollection || !accountsDocRef) return false;

        try {
            await runTransaction(db, async (transaction) => {
                const newTradeRef = doc(tradesCollection);
                transaction.set(newTradeRef, {
                    ...trade,
                    date: Timestamp.fromDate(trade.date),
                });

                const accountsDoc = await transaction.get(accountsDocRef);
                if (!accountsDoc.exists()) {
                    console.warn("Accounts document not found for user. Skipping balance update.");
                    return;
                }

                const accounts = accountsDoc.data().accounts || [];
                const accountIndex = accounts.findIndex((acc: any) => acc.id === trade.accountId);
                
                if (accountIndex === -1) {
                    console.warn(`Account with ID ${trade.accountId} not found. Trade will be added without balance update.`);
                    return;
                };

                const updatedAccounts = [...accounts];
                const currentBalance = updatedAccounts[accountIndex].currentBalance ?? updatedAccounts[accountIndex].initialBalance;
                updatedAccounts[accountIndex].currentBalance = currentBalance + (trade.pnl || 0);

                transaction.update(accountsDocRef, { accounts: updatedAccounts });
            });

            triggerRefresh();
            return true;
        } catch (error) {
            console.error("Error adding trade:", error);
            toast({ variant: "destructive", title: "Error Saving Trade", description: "Could not save the trade." });
            return false;
        }
    }, [getTradesCollectionRef, getAccountsDocRef, toast]);

    const addMultipleTrades = useCallback(async (newTrades: Omit<Trade, 'id'>[]) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection || newTrades.length === 0) return { success: false, addedCount: 0 };
        try {
            const batch = writeBatch(db);
            newTrades.forEach(trade => {
                const docRef = doc(tradesCollection);
                const tradeWithDateObject = { ...trade, date: new Date(trade.date) };
                batch.set(docRef, { ...tradeWithDateObject, date: Timestamp.fromDate(tradeWithDateObject.date) });
            });

            await batch.commit();
            triggerRefresh();

            toast({
                title: "Import Successful",
                description: "Batch import does not automatically update account balances. Please review balances manually if needed.",
            })

            return { success: true, addedCount: newTrades.length };
        } catch (error) {
            console.error("Error batch adding trades:", error);
            toast({ variant: "destructive", title: "Import Error", description: "Could not save the imported trades." });
            return { success: false, addedCount: 0 };
        }
    }, [getTradesCollectionRef, toast]);

    const updateTrade = useCallback(async (trade: Trade) => {
        const tradesCollection = getTradesCollectionRef();
        const accountsDocRef = getAccountsDocRef();
        if (!tradesCollection || !accountsDocRef || !trade.id) return false;

        try {
            const tradeRef = doc(tradesCollection, trade.id);
            await runTransaction(db, async (transaction) => {
                const originalTradeDoc = await transaction.get(tradeRef);
                if (!originalTradeDoc.exists()) {
                    throw new Error("Original trade not found for update.");
                }
                const originalTrade = originalTradeDoc.data() as Trade;
                const pnlDifference = (trade.pnl || 0) - (originalTrade.pnl || 0);

                const { id, ...tradeData } = trade;
                transaction.update(tradeRef, {
                    ...tradeData,
                    date: Timestamp.fromDate(trade.date),
                });
                
                const accountsDoc = await transaction.get(accountsDocRef);
                if (!accountsDoc.exists()) {
                     console.warn("Accounts document not found for user. Skipping balance update.");
                     return;
                }
                const accounts = accountsDoc.data().accounts || [];
                const accountIndex = accounts.findIndex((acc: any) => acc.id === trade.accountId);

                if (accountIndex === -1) return;

                const updatedAccounts = [...accounts];
                const currentBalance = updatedAccounts[accountIndex].currentBalance ?? updatedAccounts[accountIndex].initialBalance;
                updatedAccounts[accountIndex].currentBalance = currentBalance + pnlDifference;
                
                transaction.update(accountsDocRef, { accounts: updatedAccounts });
            });

            triggerRefresh();
            return true;
        } catch (error) {
            console.error("Error updating trade:", error);
            toast({ variant: "destructive", title: "Error Updating Trade", description: "Could not update the trade." });
            return false;
        }
    }, [getTradesCollectionRef, getAccountsDocRef, toast]);

    const deleteTrade = useCallback(async (id: string) => {
        const tradesCollection = getTradesCollectionRef();
        const accountsDocRef = getAccountsDocRef();
        if (!tradesCollection || !accountsDocRef) return false;

        try {
            const tradeRef = doc(tradesCollection, id);

             await runTransaction(db, async (transaction) => {
                const tradeDoc = await transaction.get(tradeRef);
                if (!tradeDoc.exists()) {
                    throw new Error("Trade to delete not found.");
                }
                const tradeToDelete = tradeDoc.data() as Trade;
                const pnlToRemove = tradeToDelete.pnl || 0;

                transaction.delete(tradeRef);
                
                const accountsDoc = await transaction.get(accountsDocRef);
                if (!accountsDoc.exists()) {
                     console.warn("Accounts document not found for user. Skipping balance update.");
                     return;
                }
                const accounts = accountsDoc.data().accounts || [];
                const accountIndex = accounts.findIndex((acc: any) => acc.id === tradeToDelete.accountId);
                
                if (accountIndex === -1) return;
                
                const updatedAccounts = [...accounts];
                const currentBalance = updatedAccounts[accountIndex].currentBalance ?? updatedAccounts[accountIndex].initialBalance;
                updatedAccounts[accountIndex].currentBalance = currentBalance - pnlToRemove;
                
                transaction.update(accountsDocRef, { accounts: updatedAccounts });
             });

            triggerRefresh();
            return true;
        } catch (error) {
            console.error("Error deleting trade:", error);
            toast({ variant: "destructive", title: "Error Deleting Trade", description: "Could not delete the trade." });
            return false;
        }
    }, [getTradesCollectionRef, getAccountsDocRef, toast]);

    const deleteAllTrades = useCallback(async (accountId: string) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection || !accountId) return false;

        try {
            const q = query(tradesCollection, where('accountId', '==', accountId));
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            toast({
                title: "All Trades Cleared",
                description: "Your account balance for this account has not been reset. You may need to edit it manually in Settings.",
            })

            triggerRefresh();
            return true;
        } catch (error) {
            console.error("Error deleting all trades:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not clear trade log." });
            return false;
        }
    }, [getTradesCollectionRef, toast]);

    const value = useMemo(() => ({
        allTrades,
        isTradesLoading,
        addTrade,
        addMultipleTrades,
        updateTrade,
        deleteTrade,
        deleteAllTrades,
        refreshKey
    }), [allTrades, isTradesLoading, addTrade, addMultipleTrades, updateTrade, deleteTrade, deleteAllTrades, refreshKey]);

    return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export const useTrades = (): TradesContextType => {
    const context = useContext(TradesContext);
    if (!context) {
        throw new Error('useTrades must be used within a TradesProvider');
    }
    return context;
};
