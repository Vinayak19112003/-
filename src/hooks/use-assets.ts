
"use client";

import { useState, useEffect, useCallback } from 'react';

const ASSET_STORAGE_KEY = 'tradevision-assets';
const DEFAULT_ASSETS = ["NAS100", "EURUSD", "XAUUSD"];

export function useAssets() {
  const [assets, setAssets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let initialAssets: string[] = [];
    try {
      const storedAssets = localStorage.getItem(ASSET_STORAGE_KEY);
      if (storedAssets) {
        initialAssets = JSON.parse(storedAssets);
      } else {
        initialAssets = DEFAULT_ASSETS;
        localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(DEFAULT_ASSETS));
      }
    } catch (error) {
      console.error("Failed to load assets from localStorage.", error);
      initialAssets = DEFAULT_ASSETS;
    } finally {
      setAssets(initialAssets.sort());
      setIsLoaded(true);
    }
  }, []);

  const updateStorage = useCallback((updatedAssets: string[]) => {
    const sorted = [...new Set(updatedAssets)].sort();
    setAssets(sorted);
    localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(sorted));
  }, []);


  const addAsset = useCallback((newAsset: string): boolean => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    if (trimmedAsset && !assets.some(a => a.toLowerCase() === trimmedAsset.toLowerCase())) {
      const updatedAssets = [...assets, trimmedAsset];
      updateStorage(updatedAssets);
      return true;
    }
    return false;
  }, [assets, updateStorage]);

  const removeAsset = useCallback((assetToRemove: string) => {
    const updatedAssets = assets.filter(a => a !== assetToRemove);
    updateStorage(updatedAssets);
  }, [assets, updateStorage]);


  return { assets, addAsset, removeAsset, isLoaded };
}
