
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { useDailyHabitLog } from '@/hooks/use-daily-habit-log';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ManageHabitsDialog } from './manage-habits-dialog';
import { DisciplineCalendar } from './discipline-calendar';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyLog } from '@/hooks/use-daily-habit-log';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const HABIT_LOGS_COLLECTION = 'habitLogs';

export function HabitTracker() {
    const { user } = useAuth();
    const { habits, addHabit, deleteHabit, isLoaded: habitsLoaded } = useHabits();
    const { dailyLog, toggleHabit, isLoaded: logLoaded } = useDailyHabitLog();
    const [monthlyLogs, setMonthlyLogs] = useState<DailyLog[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthlyLogsLoaded, setMonthlyLogsLoaded] = useState(false);

    // Combine today's log with the monthly logs for the calendar
    // This ensures the calendar updates instantly when a checkbox is toggled
    const calendarLogs = useMemo(() => {
        const logsMap = new Map(monthlyLogs.map(log => [format(log.date, 'yyyy-MM-dd'), log]));
        if (dailyLog) {
            logsMap.set(format(dailyLog.date, 'yyyy-MM-dd'), dailyLog);
        }
        return Array.from(logsMap.values());
    }, [monthlyLogs, dailyLog]);

    // Effect to fetch logs for the calendar
    useEffect(() => {
        if (!user || !habitsLoaded) return;

        setMonthlyLogsLoaded(false);
        const firstDay = startOfMonth(currentMonth);
        const lastDay = endOfMonth(currentMonth);

        const q = query(
            collection(db, 'users', user.uid, HABIT_LOGS_COLLECTION),
            where('date', '>=', firstDay),
            where('date', '<=', lastDay)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    date: (data.date as Timestamp).toDate(),
                    habits: data.habits || [],
                };
            });
            setMonthlyLogs(logs);
            setMonthlyLogsLoaded(true);
        }, (error) => {
            console.error("Error fetching monthly logs: ", error);
            setMonthlyLogsLoaded(true);
        });

        return () => unsubscribe();
    }, [user, currentMonth, habitsLoaded]);

    const handleToggle = (habit: string) => {
        toggleHabit(habit);
    };
    
    if (!habitsLoaded) {
        return <Skeleton className="h-48 w-full" />;
    }
    
    const completedHabits = dailyLog?.habits || [];

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
                                    checked={completedHabits.includes(habit)}
                                    onCheckedChange={() => handleToggle(habit)}
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

            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>Discipline Calendar</CardTitle>
                    <CardDescription>
                       Visualize your consistency over time. Each cell shows your habit completion rate for that day.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DisciplineCalendar 
                        logs={calendarLogs}
                        definedHabits={habits}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        isLoaded={monthlyLogsLoaded}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
