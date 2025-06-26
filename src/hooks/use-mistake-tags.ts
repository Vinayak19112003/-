
"use client";

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_MISTAKE_TAGS } from '@/lib/constants';

const MISTAKES_STORAGE_KEY = 'user-mistake-tags';

export function useMistakeTags() {
  const [mistakeTags, setMistakeTags] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTags = localStorage.getItem(MISTAKES_STORAGE_KEY);
      if (storedTags) {
        setMistakeTags(JSON.parse(storedTags));
      } else {
        setMistakeTags([...DEFAULT_MISTAKE_TAGS]);
      }
    } catch (error) {
      console.error("Failed to load mistake tags from localStorage", error);
      setMistakeTags([...DEFAULT_MISTAKE_TAGS]);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(MISTAKES_STORAGE_KEY, JSON.stringify(mistakeTags));
    }
  }, [mistakeTags, isLoaded]);

  const addMistakeTag = useCallback((newTag: string): Promise<boolean> => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag || mistakeTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
        return Promise.resolve(false);
    }
    setMistakeTags(prevTags => [...prevTags, trimmedTag].sort());
    return Promise.resolve(true);
  }, [mistakeTags]);

  const removeMistakeTag = useCallback((tagToRemove: string) => {
    setMistakeTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
    return Promise.resolve();
  }, []);

  return { mistakeTags, addMistakeTag, removeMistakeTag, isLoaded };
}
