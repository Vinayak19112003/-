
"use client";

import useJournalSettings, { HabitHistory } from './use-journal-settings';
import { DEFAULT_HABITS } from '@/lib/constants';

export { HabitHistory };
export function useHabits() {
    const { items, addItem, deleteItem, isLoaded, habitHistory } = useJournalSettings('habits', DEFAULT_HABITS);
    return { habits: items, addHabit: addItem, deleteHabit: deleteItem, isLoaded, habitHistory };
}
