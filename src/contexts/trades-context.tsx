
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
} from "firebase/firestore";
import { Trade } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

const TRADES_COLLECTION = 'trades';
const SETTINGS_COLLECTION = 'settings';
const ACCOUNTS_DOC_ID = 'userConfig'; // Accounts are stored within the userConfig doc

interface TradesContextType {
    addTrade: (trade: Omit<Trade, 'id'>) => Promise<boolean>;
    addMultipleTrades: (newTrades: Omit<Trade, 'id'>[]) => Promise<{success: boolean, addedCount: number}>;
    updateTrade: (trade: Trade) => Promise<boolean>;
    deleteTrade: (id: string) => Promise<boolean>;
    deleteAllTrades: () => Promise<boolean>;
    refreshKey: number;
}

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => setRefreshKey(prev => prev + 1);

    const getTradesCollectionRef = useCallback(() => {
        if (!user || !db) return null;
        return collection(db, 'users', user.uid, TRADES_COLLECTION);
    }, [user]);

    const getAccountsDocRef = useCallback(() => {
        if (!user || !db) return null;
        return doc(db, 'users', user.uid, SETTINGS_COLLECTION, ACCOUNTS_DOC_ID);
    }, [user]);

    const addTrade = useCallback(async (trade: Omit<Trade, 'id'>) => {
        const tradesCollection = getTradesCollectionRef();
        const accountsDocRef = getAccountsDocRef();
        if (!tradesCollection || !accountsDocRef) return false;

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Add the new trade
                const newTradeRef = doc(tradesCollection);
                transaction.set(newTradeRef, {
                    ...trade,
                    date: Timestamp.fromDate(trade.date),
                });

                // 2. Update the account balance
                const accountDoc = await transaction.get(accountsDocRef);
                if (!accountDoc.exists()) {
                    throw new Error("Settings document not found for user.");
                }

                const accounts = accountDoc.data().accounts || [];
                const accountIndex = accounts.findIndex((acc: any) => acc.id === trade.accountId);
                
                if (accountIndex === -1) {
                    // This might happen if the account was deleted in another tab.
                    // We'll proceed with adding the trade but won't update a balance.
                    console.warn(`Account with ID ${trade.accountId} not found. Trade will be added without balance update.`);
                    return;
                };

                const updatedAccounts = [...accounts];
                const currentBalance = updatedAccounts[accountIndex].currentBalance || updatedAccounts[accountIndex].initialBalance;
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

        // Note: For simplicity, batch import does not update account balances automatically yet.
        // This would require a more complex transaction or a cloud function to handle at scale.
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
                // 1. Get the original trade to calculate PNL difference
                const originalTradeDoc = await transaction.get(tradeRef);
                if (!originalTradeDoc.exists()) {
                    throw new Error("Original trade not found for update.");
                }
                const originalTrade = originalTradeDoc.data() as Trade;
                const pnlDifference = (trade.pnl || 0) - (originalTrade.pnl || 0);

                // 2. Update the trade document
                const { id, ...tradeData } = trade;
                transaction.update(tradeRef, {
                    ...tradeData,
                    date: Timestamp.fromDate(trade.date),
                });
                
                // 3. Update the account balance
                const accountDoc = await transaction.get(accountsDocRef);
                if (!accountDoc.exists()) {
                     throw new Error("Settings document not found for user.");
                }
                const accounts = accountDoc.data().accounts || [];
                const accountIndex = accounts.findIndex((acc: any) => acc.id === trade.accountId);

                if (accountIndex === -1) return;

                const updatedAccounts = [...accounts];
                const currentBalance = updatedAccounts[accountIndex].currentBalance || updatedAccounts[accountIndex].initialBalance;
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

                // 1. Delete the trade
                transaction.delete(tradeRef);
                
                // 2. Update the account balance
                const accountDoc = await transaction.get(accountsDocRef);
                if (!accountDoc.exists()) {
                     throw new Error("Settings document not found for user.");
                }
                const accounts = accountDoc.data().accounts || [];
                const accountIndex = accounts.findIndex((acc: any) => acc.id === tradeToDelete.accountId);
                
                if (accountIndex === -1) return;
                
                const updatedAccounts = [...accounts];
                const currentBalance = updatedAccounts[accountIndex].currentBalance || updatedAccounts[accountIndex].initialBalance;
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

    const deleteAllTrades = useCallback(async () => {
        const tradesCollection = getTradesCollectionRef();
        if (!tradesCollection) return false;

        // Note: This does NOT update account balances, as it's a bulk operation
        // intended for a full reset. We can add a cloud function for this later if needed.
        try {
            const q = query(tradesCollection);
            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();

            toast({
                title: "All Trades Cleared",
                description: "Your account balances have not been reset. You may need to edit them manually in Settings.",
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
        addTrade,
        addMultipleTrades,
        updateTrade,
        deleteTrade,
        deleteAllTrades,
        refreshKey
    }), [addTrade, addMultipleTrades, updateTrade, deleteTrade, deleteAllTrades, refreshKey]);

    return <TradesContext.Provider value={value}>{children}</TradesContext.Provider>;
}

export const useTrades = (): TradesContextType => {
    const context = useContext(TradesContext);
    if (!context) {
        throw new Error('useTrades must be used within a TradesProvider');
    }
    return context;
};
