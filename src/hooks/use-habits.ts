
"use client";

import useJournalSettings from './use-journal-settings';
import { DEFAULT_HABITS } from '@/lib/constants';

export function useHabits() {
    const { items, addItem, deleteItem, isLoaded } = useJournalSettings('habits', DEFAULT_HABITS);
    return { habits: items, addHabit: addItem, deleteHabit: deleteItem, isLoaded };
}
