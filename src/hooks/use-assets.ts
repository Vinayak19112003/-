
"use client";

import { useState, useEffect } from 'react';

const ASSET_STORAGE_KEY = 'tradevision-assets';
const DEFAULT_ASSETS = ["NAS100", "EURUSD", "XAUUSD"];

export function useAssets() {
  const [assets, setAssets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let initialAssets: string[];
    try {
      const storedAssets = localStorage.getItem(ASSET_STORAGE_KEY);
      if (storedAssets) {
        initialAssets = JSON.parse(storedAssets);
      } else {
        initialAssets = DEFAULT_ASSETS;
      }
    } catch (error) {
      console.error("Failed to load assets from localStorage.", error);
      initialAssets = DEFAULT_ASSETS;
    }
    setAssets(initialAssets.sort());
    setIsLoaded(true);
  }, []);
  
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
      } catch (error) {
        console.error("Failed to save assets to localStorage", error);
      }
    }
  }, [assets, isLoaded]);

  const addAsset = (newAsset: string): boolean => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    if (!trimmedAsset || assets.some(a => a.toLowerCase() === trimmedAsset.toLowerCase())) {
      return false;
    }
    setAssets(currentAssets => [...currentAssets, trimmedAsset].sort());
    return true;
  };

  const removeAsset = (assetToRemove: string) => {
    setAssets(currentAssets => currentAssets.filter(a => a !== assetToRemove));
  };

  return { assets, addAsset, removeAsset, isLoaded };
}
