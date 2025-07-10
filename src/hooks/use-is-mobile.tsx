"use client";

import { useState, useEffect, useMemo } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const mql = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  }, []);

  useEffect(() => {
    setHasMounted(true);

    if (!mql) {
      return;
    }

    const checkDevice = () => {
      setIsMobile(mql.matches);
    };

    checkDevice();
    mql.addEventListener('change', checkDevice);

    return () => {
      mql.removeEventListener('change', checkDevice);
    };
  }, [mql]);

  return hasMounted ? isMobile : false;
}