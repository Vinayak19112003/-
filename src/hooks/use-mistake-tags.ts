
"use client";

import { useState, useEffect } from 'react';
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
        initialTags = JSON.parse(storedTags);
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
  
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(MISTAKE_TAGS_STORAGE_KEY, JSON.stringify(mistakeTags));
      } catch (error) {
        console.error("Failed to save mistake tags to localStorage", error);
      }
    }
  }, [mistakeTags, isLoaded]);

  const addMistakeTag = (newTag: string): boolean => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag || mistakeTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
      return false;
    }
    setMistakeTags(currentTags => [...currentTags, trimmedTag].sort());
    return true;
  };

  const removeMistakeTag = (tagToRemove: string) => {
    setMistakeTags(currentTags => currentTags.filter(tag => tag !== tagToRemove));
  };

  return { mistakeTags, addMistakeTag, removeMistakeTag, isLoaded };
}
