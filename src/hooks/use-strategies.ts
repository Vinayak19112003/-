
"use client";

import useJournalSettings from './use-journal-settings';
import { DEFAULT_STRATEGIES } from '@/lib/constants';

export function useStrategies() {
  const { items, addItem, deleteItem, isLoaded } = useJournalSettings('strategies', DEFAULT_STRATEGIES);
  return { strategies: items, addStrategy: addItem, deleteStrategy: deleteItem, isLoaded };
}
