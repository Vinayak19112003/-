
"use client";

import { useState, useEffect } from 'react';

const DEFAULT_ASSETS = ["NAS100", "EURUSD", "XAUUSD"];
const ASSETS_STORAGE_KEY = 'user-assets';

export function useAssets() {
  const [assets, setAssets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedAssets = localStorage.getItem(ASSETS_STORAGE_KEY);
      if (storedAssets) {
        setAssets(JSON.parse(storedAssets));
      } else {
        setAssets(DEFAULT_ASSETS);
      }
    } catch (error) {
      console.error("Failed to load assets from localStorage", error);
      setAssets(DEFAULT_ASSETS);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(ASSETS_STORAGE_KEY, JSON.stringify(assets));
    }
  }, [assets, isLoaded]);

  const addAsset = (newAsset: string): Promise<boolean> => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    if (!trimmedAsset || assets.some(a => a.toLowerCase() === trimmedAsset.toLowerCase())) {
        return Promise.resolve(false);
    }
    setAssets(prevAssets => [...prevAssets, trimmedAsset].sort());
    return Promise.resolve(true);
  };

  const removeAsset = (assetToRemove: string) => {
    setAssets(prevAssets => prevAssets.filter(asset => asset !== assetToRemove));
    return Promise.resolve();
  };

  return { assets, addAsset, removeAsset, isLoaded };
}
