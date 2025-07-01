
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { useToast } from './use-toast';
import { DEFAULT_ASSETS, DEFAULT_STRATEGIES, DEFAULT_MISTAKE_TAGS } from '@/lib/constants';

const SETTINGS_COLLECTION = 'journalSettings';
const SETTINGS_DOC_ID = 'userConfig';

type SettingsKey = 'assets' | 'strategies' | 'mistakeTags';

const useJournalSettings = (key: SettingsKey, defaultValues: readonly string[] | string[]) => {
  const [items, setItems] = useState<string[]>([...defaultValues]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const getSettingsDocRef = useCallback(() => {
    return doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  }, []);

  useEffect(() => {
    const docRef = getSettingsDocRef();

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (!docSnap.exists()) {
        try {
          // Initialize the document if it doesn't exist
          await setDoc(docRef, {
            assets: [...DEFAULT_ASSETS],
            strategies: [...DEFAULT_STRATEGIES],
            mistakeTags: [...DEFAULT_MISTAKE_TAGS],
          });
        } catch (error) {
          console.error("Failed to initialize settings doc:", error);
        }
        // The listener will be triggered again by setDoc, so we can just return
        return;
      }
      
      const data = docSnap.data();
      const currentItems = data[key];

      if (Array.isArray(currentItems)) {
        // Use the items from DB, or the default list if DB is empty
        setItems(currentItems.length > 0 ? currentItems : [...defaultValues]);
      } else {
        // The field for this key (e.g. 'assets') is missing, so add it.
        setItems([...defaultValues]);
        await updateDoc(docRef, { [key]: [...defaultValues] });
      }

      setIsLoaded(true);

    }, (error) => {
      console.error(`Error with settings snapshot for ${key}:`, error);
      toast({
          variant: "destructive",
          title: "Sync Error",
          description: `Could not load settings. Using default values.`,
      });
      setItems([...defaultValues]);
      setIsLoaded(true);
    });
    
    return () => unsubscribe();
  }, [key, defaultValues, getSettingsDocRef, toast]);


  const addItem = async (newItem: string): Promise<boolean> => {
    const trimmedItem = key === 'assets' ? newItem.trim().toUpperCase() : newItem.trim();
    if (!trimmedItem) return false;
    
    if (items.some(i => i.toLowerCase() === trimmedItem.toLowerCase())) {
        toast({
            variant: "destructive",
            title: "Item Exists",
            description: `This ${key.slice(0,-1)} is already in your list.`,
        });
        return false;
    }

    try {
      const docRef = getSettingsDocRef();
      await updateDoc(docRef, {
        [key]: arrayUnion(trimmedItem)
      });
      toast({
        title: "Item Added",
        description: `"${trimmedItem}" has been added.`,
      });
      return true;
    } catch (error) {
       console.error(`Error adding ${key}:`, error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save the item.",
      });
      return false;
    }
  };

  const deleteItem = async (itemToDelete: string) => {
    try {
        const docRef = getSettingsDocRef();
        await updateDoc(docRef, {
            [key]: arrayRemove(itemToDelete)
        });
        toast({
            title: "Item Deleted",
            description: `"${itemToDelete}" has been removed.`,
        });
    } catch (error) {
        console.error(`Error deleting ${key}:`, error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the item.",
        });
    }
  };

  return { items, addItem, deleteItem, isLoaded };
};

export default useJournalSettings;
