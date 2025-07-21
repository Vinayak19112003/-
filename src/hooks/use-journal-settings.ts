
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc, Timestamp } from "firebase/firestore";
import { useToast } from './use-toast';
import { DEFAULT_ASSETS, DEFAULT_STRATEGIES, DEFAULT_MISTAKE_TAGS, DEFAULT_TRADING_RULES, DEFAULT_TRADING_MODEL, DEFAULT_ACCOUNTS } from '@/lib/constants';
import { useAuth } from './use-auth';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'userConfig';

type SettingsKey = 'assets' | 'strategies' | 'mistakeTags' | 'tradingRules' | 'tradingModel' | 'accounts';


const useJournalSettings = (key: SettingsKey, defaultValues: any) => {
  const { user } = useAuth();
  const [items, setItems] = useState(defaultValues);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const getSettingsDocRef = useCallback(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  }, [user]);

  // Effect to initialize settings for a new user
  useEffect(() => {
    const initializeSettings = async () => {
      const docRef = getSettingsDocRef();
      if (!docRef) return;

      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          // If the user's settings doc doesn't exist, create it.
          await setDoc(docRef, {
            assets: [...DEFAULT_ASSETS],
            strategies: [...DEFAULT_STRATEGIES],
            mistakeTags: [...DEFAULT_MISTAKE_TAGS],
            tradingRules: [...DEFAULT_TRADING_RULES],
            tradingModel: { ...DEFAULT_TRADING_MODEL },
            accounts: [...DEFAULT_ACCOUNTS],
          });
        }
      } catch (error) {
        console.error("Failed to check or initialize settings doc:", error);
      }
    };

    if (user) {
      initializeSettings();
    }
  }, [user, getSettingsDocRef]);
  

  // Effect to listen for real-time updates
  useEffect(() => {
    if (!user) {
        setItems(defaultValues);
        setIsLoaded(true);
        return;
    }
    
    if (!db) {
        toast({
            variant: 'destructive',
            title: 'Database Connection Error',
            description: 'Could not connect to the database. Using default values.',
        });
        setItems(defaultValues);
        setIsLoaded(true);
        return;
    }

    const docRef = getSettingsDocRef();
    if (!docRef) {
        setIsLoaded(true);
        return;
    }

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
          const data = docSnap.data();
          const currentItems = data[key];

          if (currentItems) {
            setItems(currentItems);
          } else {
            // Field might not exist yet for an old user, so we set it
            if (key === 'accounts' && !data.accounts) {
                updateDoc(docRef, { accounts: [...DEFAULT_ACCOUNTS] });
            }
            setItems(defaultValues);
          }
      }
      setIsLoaded(true);
    }, (error) => {
      console.error(`Error with settings snapshot for ${key}:`, error);
      toast({
          variant: "destructive",
          title: "Sync Error",
          description: `Could not load settings. Using default values.`,
      });
      setItems(defaultValues);
      setIsLoaded(true);
    });
    
    return () => unsubscribe();
  }, [user, key, defaultValues, getSettingsDocRef, toast]);


  const addItem = async (newItem: any): Promise<boolean> => {
    const docRef = getSettingsDocRef();
    if (!docRef) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'You must be logged in and connected to add an item.' });
      return false;
    }

    let trimmedItem = newItem;
    if (typeof newItem === 'string') {
        trimmedItem = key === 'assets' ? newItem.trim().toUpperCase() : newItem.trim();
        if (!trimmedItem) return false;
        
        if (items.some((i: string) => i.trim().toLowerCase() === trimmedItem.toLowerCase())) {
            toast({
                variant: "destructive",
                title: "Item Exists",
                description: `This ${key.slice(0,-1)} is already in your list.`,
            });
            return false;
        }
    } else { // Handle account object
        if (items.some((i: any) => i.name.trim().toLowerCase() === newItem.name.trim().toLowerCase())) {
             toast({
                variant: "destructive",
                title: "Account Exists",
                description: `An account with this name already exists.`,
            });
            return false;
        }
    }


    try {
      const updatePayload: { [k: string]: any } = { [key]: arrayUnion(trimmedItem) };
      await updateDoc(docRef, updatePayload);
      toast({
        title: "Item Added",
        description: `New item has been added.`,
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

  const deleteItem = async (itemToDelete: any) => {
    const docRef = getSettingsDocRef();
    if (!docRef) {
        toast({ variant: 'destructive', title: 'Database Error', description: 'You must be logged in and connected to delete an item.' });
        return;
    }
    try {
        const updatePayload: { [k: string]: any } = { [key]: arrayRemove(itemToDelete) };
        await updateDoc(docRef, updatePayload);
        toast({
            title: "Item Deleted",
            description: `Item has been removed.`,
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
  
  const updateWholeObject = async (newObject: any) => {
    const docRef = getSettingsDocRef();
    if (!docRef) {
      toast({ variant: 'destructive', title: 'Database Error', description: 'You must be logged in and connected.' });
      return false;
    }
     try {
      const updatePayload = { [key]: newObject };
      await updateDoc(docRef, updatePayload);
      return true;
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast({ variant: "destructive", title: "Update Error", description: "Could not save changes." });
      return false;
    }
  }

  return { items, addItem, deleteItem, updateWholeObject, isLoaded };
};

export default useJournalSettings;
