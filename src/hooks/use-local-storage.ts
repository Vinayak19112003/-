
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// A custom hook to read and write to localStorage, handling server-side rendering.
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Effect to read from localStorage on the client side
  useEffect(() => {
    let value: T;
    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      value = item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error, return initialValue
      console.error(`Error reading localStorage key “${key}”:`, error);
      value = initialValue;
    }
    setStoredValue(value);
    setIsLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Effect to write to localStorage on the client side
  useEffect(() => {
    // Only set item if loaded to avoid overwriting on initial render
    if (isLoaded) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch(error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, storedValue, isLoaded]);

  return [storedValue, setStoredValue, isLoaded];
}

export default useLocalStorage;
