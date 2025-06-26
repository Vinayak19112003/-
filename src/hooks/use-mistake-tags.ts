
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { DEFAULT_MISTAKE_TAGS } from '@/lib/constants';

const settingsDocRef = doc(db, 'settings', 'mistakeTags');


export function useMistakeTags() {
  const [mistakeTags, setMistakeTags] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(settingsDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.values) && data.values.every(item => typeof item === 'string')) {
          setMistakeTags(data.values.sort());
        } else {
          await setDoc(settingsDocRef, { values: [...DEFAULT_MISTAKE_TAGS] });
          setMistakeTags([...DEFAULT_MISTAKE_TAGS].sort());
        }
      } else {
        await setDoc(settingsDocRef, { values: [...DEFAULT_MISTAKE_TAGS] });
        setMistakeTags([...DEFAULT_MISTAKE_TAGS].sort());
      }
      setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching mistake tags from Firestore:", error);
      setMistakeTags([...DEFAULT_MISTAKE_TAGS].sort());
      setIsLoaded(true);
    });
    
    return () => unsubscribe();
  }, []);

  const addMistakeTag = useCallback(async (newTag: string): Promise<boolean> => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag || mistakeTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
        return false;
    }
    
    try {
        await updateDoc(settingsDocRef, {
            values: arrayUnion(trimmedTag)
        });
        return true;
    } catch (error) {
        console.error("Error adding mistake tag to Firestore:", error);
        return false;
    }
  }, [mistakeTags]);

  const removeMistakeTag = useCallback(async (tagToRemove: string) => {
    try {
        await updateDoc(settingsDocRef, {
            values: arrayRemove(tagToRemove)
        });
    } catch (error) {
        console.error("Error removing mistake tag from Firestore:", error);
    }
  }, []);

  return { mistakeTags, addMistakeTag, removeMistakeTag, isLoaded };
}
