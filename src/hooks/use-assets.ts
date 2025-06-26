
"use client";

import { useCallback } from 'react';
import useLocalStorage from './use-local-storage';

const DEFAULT_ASSETS = ["NAS100", "EURUSD", "XAUUSD"];
const ASSETS_STORAGE_KEY = 'user-assets';

export function useAssets() {
  const [assets, setAssets, isLoaded] = useLocalStorage<string[]>(ASSETS_STORAGE_KEY, DEFAULT_ASSETS);

  const addAsset = useCallback((newAsset: string): boolean => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    if (!trimmedAsset) return false;

    let success = false;
    setAssets(prevAssets => {
      if (prevAssets.some(a => a.toLowerCase() === trimmedAsset.toLowerCase())) {
        return prevAssets;
      }
      success = true;
      return [...prevAssets, trimmedAsset].sort();
    });
    return success;
  }, [setAssets]);

  return { assets, addAsset, isLoaded };
}
