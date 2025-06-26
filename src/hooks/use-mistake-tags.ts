
"use client";

import useLocalStorage from './use-local-storage';
import { DEFAULT_MISTAKE_TAGS } from '@/lib/constants';

const MISTAKES_STORAGE_KEY = 'user-mistake-tags';

export function useMistakeTags() {
  const [mistakeTags, setMistakeTags, isLoaded] = useLocalStorage<string[]>(
    MISTAKES_STORAGE_KEY, 
    [...DEFAULT_MISTAKE_TAGS]
  );

  const addMistakeTag = (newTag: string): boolean => {
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
  };

  const deleteMistakeTag = (tagToDelete: string) => {
    setMistakeTags(prev => prev.filter(tag => tag !== tagToDelete));
  };

  return { mistakeTags, addMistakeTag, deleteMistakeTag, isLoaded };
}
