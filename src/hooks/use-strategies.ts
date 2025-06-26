
"use client";

import useLocalStorage from './use-local-storage';
import { DEFAULT_STRATEGIES } from '@/lib/constants';

const STRATEGIES_STORAGE_KEY = 'user-strategies';

export function useStrategies() {
  const [strategies, setStrategies, isLoaded] = useLocalStorage<string[]>(
    STRATEGIES_STORAGE_KEY,
    [...DEFAULT_STRATEGIES]
  );

  const addStrategy = (newStrategy: string): boolean => {
    const trimmedStrategy = newStrategy.trim();
    if (!trimmedStrategy) return false;

    let success = false;
    setStrategies(prevStrategies => {
      if (prevStrategies.some(s => s.toLowerCase() === trimmedStrategy.toLowerCase())) {
        return prevStrategies;
      }
      success = true;
      return [...prevStrategies, trimmedStrategy].sort();
    });
    return success;
  };

  const deleteStrategy = (strategyToDelete: string) => {
    setStrategies(prev => prev.filter(strategy => strategy !== strategyToDelete));
  };

  return { strategies, addStrategy, deleteStrategy, isLoaded };
}
