
"use client";

import { useState, useEffect, useCallback } from 'react';

const ASSET_STORAGE_KEY = 'tradevision-assets';
const DEFAULT_ASSETS = ["NAS100", "EURUSD", "XAUUSD"];

export function useAssets() {
  const [assets, setAssets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Effect to load initial assets from localStorage
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
  
  // Effect to save assets to localStorage whenever the `assets` state changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
      } catch (error) {
        console.error("Failed to save assets to localStorage", error);
      }
    }
  }, [assets, isLoaded]);

  const addAsset = useCallback((newAsset: string): boolean => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    
    // Check against the current state. `assets` is a dependency of this callback.
    if (!trimmedAsset || assets.some(a => a.toLowerCase() === trimmedAsset.toLowerCase())) {
      return false;
    }
    
    // The useEffect will handle persisting the new state to localStorage
    setAssets(currentAssets => [...currentAssets, trimmedAsset].sort());
    return true;
  }, [assets]);

  const removeAsset = useCallback((assetToRemove: string) => {
    // Functional update ensures we always have the latest state.
    // The useEffect will handle persisting the change.
    setAssets(currentAssets => currentAssets.filter(a => a !== assetToRemove));
  }, []);


  return { assets, addAsset, removeAsset, isLoaded };
}
