
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';

const DEFAULT_ASSETS = ["NAS100", "EURUSD", "XAUUSD"];
const settingsDocRef = doc(db, 'settings', 'assets');


export function useAssets() {
  const [assets, setAssets] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(settingsDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.values) && data.values.every(item => typeof item === 'string')) {
          setAssets(data.values.sort());
        } else {
          await setDoc(settingsDocRef, { values: DEFAULT_ASSETS });
          setAssets(DEFAULT_ASSETS.sort());
        }
      } else {
        await setDoc(settingsDocRef, { values: DEFAULT_ASSETS });
        setAssets(DEFAULT_ASSETS.sort());
      }
      setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching assets from Firestore:", error);
      setAssets(DEFAULT_ASSETS.sort());
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, []);
  
  const addAsset = useCallback(async (newAsset: string): Promise<boolean> => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    if (!trimmedAsset || assets.some(a => a.toLowerCase() === trimmedAsset.toLowerCase())) {
      return false;
    }
    
    try {
      await updateDoc(settingsDocRef, {
        values: arrayUnion(trimmedAsset)
      });
      return true;
    } catch (error) {
      console.error("Error adding asset to Firestore:", error);
      return false;
    }
  }, [assets]);

  const removeAsset = useCallback(async (assetToRemove: string) => {
    try {
      await updateDoc(settingsDocRef, {
        values: arrayRemove(assetToRemove)
      });
    } catch (error) {
      console.error("Error removing asset from Firestore:", error);
    }
  }, []);

  return { assets, addAsset, removeAsset, isLoaded };
}
