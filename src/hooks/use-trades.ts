
"use client";

import { useContext } from 'react';
import { TradesProvider } from '@/contexts/trades-context';

// This is a placeholder. The actual context is defined in trades-context.tsx
// We need to re-export it from here to avoid breaking imports.
export { TradesProvider };
export { useTrades } from '@/contexts/trades-context';
