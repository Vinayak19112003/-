
"use client";

import { useCallback } from 'react';
import useLocalStorage from './use-local-storage';
import { DEFAULT_MISTAKE_TAGS } from '@/lib/constants';

const MISTAKES_STORAGE_KEY = 'user-mistake-tags';

export function useMistakeTags() {
  const [mistakeTags, setMistakeTags, isLoaded] = useLocalStorage<string[]>(
    MISTAKES_STORAGE_KEY, 
    [...DEFAULT_MISTAKE_TAGS]
  );

  const addMistakeTag = useCallback((newTag: string): boolean => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return false;
    
    let success = false;
    setMistakeTags(prevTags => {
      if (prevTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
        return prevTags;
      }
      success = true;
      return [...prevTags, trimmedTag].sort();
    });
    return success;
  }, [setMistakeTags]);

  return { mistakeTags, addMistakeTag, isLoaded };
}
