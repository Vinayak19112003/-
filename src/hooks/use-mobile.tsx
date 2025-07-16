
"use client"

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') {
        setIsMobile(false);
        return;
    }
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const checkDevice = () => {
      setIsMobile(mql.matches);
    };

    checkDevice();
    mql.addEventListener('change', checkDevice);

    return () => {
      mql.removeEventListener('change', checkDevice);
    };
  }, []);

  return isMobile === undefined ? false : isMobile;
}
