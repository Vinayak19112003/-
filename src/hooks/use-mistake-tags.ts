
"use client";

import useJournalSettings from './use-journal-settings';
import { DEFAULT_MISTAKE_TAGS } from '@/lib/constants';

export function useMistakeTags() {
    const { items, addItem, deleteItem, isLoaded } = useJournalSettings('mistakeTags', DEFAULT_MISTAKE_TAGS);
    return { mistakeTags: items, addMistakeTag: addItem, deleteMistakeTag: deleteItem, isLoaded };
}
