
'use client';

import { useHabits } from '@/hooks/use-habits';
import { Skeleton } from '@/components/ui/skeleton';
import { ManageHabitsDialog } from './manage-habits-dialog';
import type { DailyLog } from '@/hooks/use-daily-habit-log';
import { Checkbox } from '@/components/ui/checkbox';

interface HabitTrackerProps {
    habits: string[];
    addHabit: (habit: string) => Promise<boolean>;
    deleteHabit: (habit: string) => Promise<void>;
    habitsLoaded: boolean;
    dailyLog: DailyLog | null;
    toggleHabit: (habit: string) => Promise<void>;
    logLoaded: boolean;
}

export function HabitTracker({
    habits,
    addHabit,
    deleteHabit,
    habitsLoaded,
    dailyLog,
    toggleHabit,
    logLoaded,
}: HabitTrackerProps) {
    if (!habitsLoaded) {
        return <Skeleton className="h-48 w-full" />;
    }

    const completedHabits = dailyLog?.habits || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Your Habits</h3>
                <ManageHabitsDialog
                    habits={habits}
                    addHabit={addHabit}
                    deleteHabit={deleteHabit}
                />
            </div>
            {habits.length > 0 ? (
                <div className="space-y-3">
                    {habits.map(habit => (
                        <div key={habit} className="flex items-center space-x-3 rounded-md border p-4">
                            <Checkbox
                                id={habit}
                                checked={completedHabits.includes(habit)}
                                onCheckedChange={() => toggleHabit(habit)}
                                aria-label={`Mark habit as ${completedHabits.includes(habit) ? 'incomplete' : 'complete'}: ${habit}`}
                                disabled={!logLoaded}
                            />
                            <label
                                htmlFor={habit}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {habit}
                            </label>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-8">
                    <p>No habits defined yet.</p>
                    <p>Click "Manage Habits" to add your first one.</p>
                </div>
            )}
        </div>
    );
}
