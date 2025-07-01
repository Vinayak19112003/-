
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc } from "firebase/firestore";
import { useToast } from './use-toast';
import { DEFAULT_ASSETS, DEFAULT_STRATEGIES, DEFAULT_MISTAKE_TAGS } from '@/lib/constants';
import { useAuth } from './use-auth';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'userConfig';

type SettingsKey = 'assets' | 'strategies' | 'mistakeTags';

const useJournalSettings = (key: SettingsKey, defaultValues: readonly string[] | string[]) => {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>([...defaultValues]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const getSettingsDocRef = useCallback(() => {
    if (!user) return null;
    // Conditional check for db to prevent errors if Firebase fails to initialize
    return db ? doc(db, 'users', user.uid, SETTINGS_COLLECTION, SETTINGS_DOC_ID) : null;
  }, [user]);

  useEffect(() => {
    if (!user) {
        setItems([...defaultValues]);
        setIsLoaded(true);
        return;
    }

    const docRef = getSettingsDocRef();
    if (!docRef) {
        if (user) { // Only show toast if user is logged in but db is not available
            toast({
                variant: 'destructive',
                title: 'Database Error',
                description: `Could not load settings. Using default values.`,
            });
        }
        setItems([...defaultValues]);
        setIsLoaded(true);
        return;
    }

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (!docSnap.exists()) {
        try {
          // Check if document exists before trying to set it.
          const initialDoc = await getDoc(docRef);
          if (!initialDoc.exists()) {
            await setDoc(docRef, {
              assets: [...DEFAULT_ASSETS],
              strategies: [...DEFAULT_STRATEGIES],
              mistakeTags: [...DEFAULT_MISTAKE_TAGS],
            });
          }
        } catch (error) {
          console.error("Failed to initialize settings doc:", error);
        }
        return;
      }
      
      const data = docSnap.data();
      const currentItems = data[key];

      if (Array.isArray(currentItems)) {
        setItems(currentItems.length > 0 ? currentItems : [...defaultValues]);
      } else {
        setItems([...defaultValues]);
        // Avoid writing back if data is just missing, could be due to partial creation.
        // await updateDoc(docRef, { [key]: [...defaultValues] }).catch(e => console.error("Failed to update missing settings field", e));
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
  }, [key, defaultValues, getSettingsDocRef, toast, user]);


  const addItem = async (newItem: string): Promise<boolean> => {
    const docRef = getSettingsDocRef();
    if (!docRef) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'You must be logged in and connected to add an item.' });
      return false;
    }
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
    const docRef = getSettingsDocRef();
    if (!docRef) {
        toast({ variant: 'destructive', title: 'Database Error', description: 'You must be logged in and connected to delete an item.' });
        return;
    }
    try {
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
