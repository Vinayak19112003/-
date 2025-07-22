
"use client";

import useJournalSettings from './use-journal-settings';
import { DEFAULT_ACCOUNTS } from '@/lib/constants';
import type { Account } from '@/lib/types';
import { useToast } from './use-toast';
import { useCallback } from 'react';

export function useAccounts() {
  const { items: accounts, updateWholeObject, isLoaded } = useJournalSettings('accounts', DEFAULT_ACCOUNTS);
  const { toast } = useToast();

  const addAccount = useCallback(async (newAccount: Omit<Account, 'id' | 'currentBalance'>) => {
    const accountWithId: Account = { 
        ...newAccount, 
        id: crypto.randomUUID(),
        currentBalance: newAccount.initialBalance,
    };

    const newAccounts = [...accounts, accountWithId];
    const success = await updateWholeObject(newAccounts);
    if(success) {
        toast({ title: "Account Added", description: `"${newAccount.name}" has been created.` });
    }
    return success;
  }, [accounts, updateWholeObject, toast]);

  const updateAccount = useCallback(async (accountId: string, updatedData: Omit<Account, 'id' | 'currentBalance'>) => {
    const newAccounts = accounts.map((acc: Account) => {
        if (acc.id === accountId) {
            // Recalculate currentBalance if initialBalance changes
            const balanceDifference = updatedData.initialBalance - acc.initialBalance;
            const newCurrentBalance = (acc.currentBalance ?? acc.initialBalance) + balanceDifference;
            return { ...acc, ...updatedData, currentBalance: newCurrentBalance };
        }
        return acc;
    });
    const success = await updateWholeObject(newAccounts);
    if(success) {
        toast({ title: "Account Updated", description: "Your account details have been saved." });
    }
    return success;
  }, [accounts, updateWholeObject, toast]);


  const deleteAccount = useCallback(async (accountId: string) => {
    const newAccounts = accounts.filter((acc: Account) => acc.id !== accountId);
    // You might want to add checks here to prevent deleting the last account
    // or an account with trades.
    const success = await updateWholeObject(newAccounts);
    if(success) {
         toast({ title: "Account Deleted", description: `The account has been removed.` });
    }
  }, [accounts, updateWholeObject, toast]);

  return { accounts, addAccount, updateAccount, deleteAccount, isLoaded };
}
