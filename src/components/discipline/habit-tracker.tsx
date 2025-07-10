
'use client';

import { useState } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { useDailyHabitLog } from '@/hooks/use-daily-habit-log';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ManageHabitsDialog } from './manage-habits-dialog';
import { DisciplineCalendar } from './discipline-calendar';
import { Separator } from '../ui/separator';

export function HabitTracker() {
    const { habits, addHabit, deleteHabit, isLoaded: habitsLoaded } = useHabits();
    const { dailyLog, toggleHabit, isLoaded: logLoaded } = useDailyHabitLog();

    const [checkedState, setCheckedState] = useState<{ [key: string]: boolean }>({});

    // This effect ensures our local state for checkboxes is in sync with the fetched data
    useState(() => {
        if (logLoaded && dailyLog) {
            const completedHabitsForToday = dailyLog.habits || [];
            const newCheckedState: { [key: string]: boolean } = {};
            habits.forEach(habit => {
                newCheckedState[habit] = completedHabitsForToday.includes(habit);
            });
            setCheckedState(newCheckedState);
        }
    });

    const handleToggle = (habit: string) => {
        setCheckedState(prevState => ({
            ...prevState,
            [habit]: !prevState[habit],
        }));
        toggleHabit(habit);
    };

    if (!habitsLoaded) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <div className="space-y-8">
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
                                    checked={checkedState[habit] || false}
                                    onCheckedChange={() => handleToggle(habit)}
                                    aria-label={`Mark habit as ${checkedState[habit] ? 'incomplete' : 'complete'}: ${habit}`}
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

            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>Discipline Calendar</CardTitle>
                    <CardDescription>
                       Visualize your consistency over time. Each cell shows your habit completion rate for that day.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DisciplineCalendar />
                </CardContent>
            </Card>
        </div>
    );
}
