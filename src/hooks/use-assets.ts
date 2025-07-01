
"use client";

import useJournalSettings from './use-journal-settings';
import { DEFAULT_ASSETS } from '@/lib/constants';

export function useAssets() {
  const { items, addItem, deleteItem, isLoaded } = useJournalSettings('assets', DEFAULT_ASSETS);
  return { assets: items, addAsset: addItem, deleteAsset: deleteItem, isLoaded };
}
