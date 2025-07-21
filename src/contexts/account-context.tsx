
'use client';

import { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import { useAccounts } from '@/hooks/use-accounts';
import type { Account } from '@/lib/types';

interface AccountContextType {
  accounts: Account[];
  selectedAccountId: string | 'all';
  setSelectedAccountId: (id: string | 'all') => void;
  isAccountsLoaded: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const { accounts, isLoaded: isAccountsLoaded } = useAccounts();

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
