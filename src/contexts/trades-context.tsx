
'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode, useState } from 'react';
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
} from "firebase/firestore";
import { Trade } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const TRADES_COLLECTION = 'trades';
const ACCOUNTS_COLLECTION = 'settings';
const ACCOUNTS_DOC_ID = 'userConfig'; 

interface TradesContextType {
    allTrades: Trade[];
    setAllTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
    addTrade: (trade: Omit<Trade, 'id'>) => Promise<boolean>;
    addMultipleTrades: (newTrades: Omit<Trade, 'id'>[]) => Promise<{success: boolean, addedCount: number}>;
    updateTrade: (trade: Trade) => Promise<boolean>;
    deleteTrade: (id: string) => Promise<boolean>;
    deleteAllTrades: (accountId: string) => Promise<boolean>;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();

    const [allTrades, setAllTrades] = useState<Trade[]>([]);

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

            setAllTrades(prev => [...prev, { ...trade, id: crypto.randomUUID(), date: new Date(trade.date) }].sort((a,b) => a.date.getTime() - b.date.getTime()));
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
            const tradesToAddLocally: Trade[] = [];
            newTrades.forEach(trade => {
                const docRef = doc(tradesCollection);
                const tradeWithDateObject = { ...trade, date: new Date(trade.date) };
                batch.set(docRef, { ...tradeWithDateObject, date: Timestamp.fromDate(tradeWithDateObject.date) });
                tradesToAddLocally.push({ ...tradeWithDateObject, id: docRef.id });
            });

            await batch.commit();
            setAllTrades(prev => [...prev, ...tradesToAddLocally].sort((a,b) => a.date.getTime() - b.date.getTime()));

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

        const originalTrade = allTrades.find(t => t.id === trade.id);
        if (!originalTrade) {
             toast({ variant: "destructive", title: "Error Updating Trade", description: "Original trade not found." });
             return false;
        }

        try {
            const tradeRef = doc(tradesCollection, trade.id);
            await runTransaction(db, async (transaction) => {
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
            setAllTrades(prev => prev.map(t => t.id === trade.id ? trade : t).sort((a,b) => a.date.getTime() - b.date.getTime()));
            return true;
        } catch (error) {
            console.error("Error updating trade:", error);
            toast({ variant: "destructive", title: "Error Updating Trade", description: "Could not update the trade." });
            return false;
        }
    }, [getTradesCollectionRef, getAccountsDocRef, toast, allTrades]);

    const deleteTrade = useCallback(async (id: string) => {
        const tradesCollection = getTradesCollectionRef();
        const accountsDocRef = getAccountsDocRef();
        if (!tradesCollection || !accountsDocRef) return false;

        const tradeToDelete = allTrades.find(t => t.id === id);
        if (!tradeToDelete) {
            toast({ variant: "destructive", title: "Error Deleting Trade", description: "Trade not found." });
            return false;
        }

        try {
            const tradeRef = doc(tradesCollection, id);

             await runTransaction(db, async (transaction) => {
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

            setAllTrades(prev => prev.filter(t => t.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting trade:", error);
            toast({ variant: "destructive", title: "Error Deleting Trade", description: "Could not delete the trade." });
            return false;
        }
    }, [getTradesCollectionRef, getAccountsDocRef, toast, allTrades]);

    const deleteAllTrades = useCallback(async (accountId: string) => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection || !accountId) return false;

        try {
            const q = query(tradesCollection, where('accountId', '==', accountId));
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            setAllTrades(prev => prev.filter(t => t.accountId !== accountId));
            toast({
                title: "All Trades Cleared",
                description: "Your account balance for this account has not been reset. You may need to edit it manually in Settings.",
            })
            return true;
        } catch (error) {
            console.error("Error deleting all trades:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not clear trade log." });
            return false;
        }
    }, [getTradesCollectionRef, toast]);

    const value = useMemo(() => ({
        allTrades,
        setAllTrades,
        addTrade,
        addMultipleTrades,
        updateTrade,
        deleteTrade,
        deleteAllTrades,
    }), [allTrades, addTrade, addMultipleTrades, updateTrade, deleteTrade, deleteAllTrades]);

    return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export const useTrades = (): TradesContextType => {
    const context = useContext(TradesContext);
    if (!context) {
        throw new Error('useTrades must be used within a TradesProvider');
    }
    return context;
};
