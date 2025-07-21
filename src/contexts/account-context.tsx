
'use client';

import { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useAccounts } from '@/hooks/use-accounts';
import type { Account } from '@/lib/types';

interface AccountContextType {
  accounts: Account[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  isAccountsLoaded: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { accounts, isLoaded: isAccountsLoaded } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    // When accounts are loaded, if no account is selected or the selected one no longer exists,
    // default to the first account in the list.
    if (isAccountsLoaded && accounts.length > 0) {
      const accountExists = accounts.some((acc: Account) => acc.id === selectedAccountId);
      if (!selectedAccountId || !accountExists) {
        setSelectedAccountId(accounts[0].id);
      }
    }
  }, [accounts, isAccountsLoaded, selectedAccountId]);


  const value = useMemo(() => ({
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    isAccountsLoaded
  }), [accounts, selectedAccountId, isAccountsLoaded]);

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccountContext must be used within an AccountProvider');
  }
  return context;
}
