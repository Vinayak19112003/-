
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

  const addAsset = useCallback((newAsset: string) => {
    if (newAsset && !assets.some(a => a.toLowerCase() === newAsset.toLowerCase())) {
      const updatedAssets = [...assets, newAsset].sort();
      setAssets(updatedAssets);
      localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(updatedAssets));
    }
  }, [assets]);

  return { assets, addAsset, isLoaded };
}
