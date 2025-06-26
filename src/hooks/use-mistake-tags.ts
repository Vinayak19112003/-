
"use client";

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_MISTAKE_TAGS } from '@/lib/constants';

const MISTAKE_TAGS_STORAGE_KEY = 'tradevision-mistake-tags';

export function useMistakeTags() {
  const [mistakeTags, setMistakeTags] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let initialTags: string[];
    try {
      const storedTags = localStorage.getItem(MISTAKE_TAGS_STORAGE_KEY);
      if (storedTags) {
        const parsed = JSON.parse(storedTags);
        if (Array.isArray(parsed)) {
            initialTags = parsed;
        } else {
            initialTags = [...DEFAULT_MISTAKE_TAGS];
        }
      } else {
        initialTags = [...DEFAULT_MISTAKE_TAGS];
      }
    } catch (error) {
      console.error("Failed to load mistake tags from localStorage.", error);
      initialTags = [...DEFAULT_MISTAKE_TAGS];
    }
    setMistakeTags(initialTags.sort());
    setIsLoaded(true);
  }, []);
  
  const updateTagsAndStorage = useCallback((updater: (tags: string[]) => string[]) => {
    setMistakeTags(currentTags => {
        const newTags = updater(currentTags);
        const sortedTags = [...newTags].sort();
        try {
            localStorage.setItem(MISTAKE_TAGS_STORAGE_KEY, JSON.stringify(sortedTags));
        } catch (error) {
            console.error("Failed to save mistake tags to localStorage", error);
        }
        return sortedTags;
    });
  }, []);


  const addMistakeTag = useCallback((newTag: string): boolean => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return false;
    
    let wasAdded = false;
    updateTagsAndStorage(currentTags => {
        if (currentTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
            return currentTags;
        }
        wasAdded = true;
        return [...currentTags, trimmedTag];
    });
    return wasAdded;
  }, [updateTagsAndStorage]);

  const removeMistakeTag = useCallback((tagToRemove: string) => {
    updateTagsAndStorage(currentTags => currentTags.filter(tag => tag !== tagToRemove));
  }, [updateTagsAndStorage]);

  return { mistakeTags, addMistakeTag, removeMistakeTag, isLoaded };
}
