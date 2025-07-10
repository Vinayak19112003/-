
"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from './use-debounce';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT);
  const debouncedWidth = useDebounce(width, 250);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = debouncedWidth < MOBILE_BREAKPOINT;

  return hasMounted ? isMobile : false;
}
