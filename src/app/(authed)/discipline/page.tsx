
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useHabits } from '@/hooks/use-habits';
import { useDailyHabitLog } from '@/hooks/use-daily-habit-log';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyLog } from '@/hooks/use-daily-habit-log';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const HabitTracker = dynamic(() => import('@/components/discipline/habit-tracker').then(mod => mod.HabitTracker), {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
});

const DisciplineCalendar = dynamic(() => import('@/components/discipline/discipline-calendar').then(mod => mod.DisciplineCalendar), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />,
});

const HABIT_LOGS_COLLECTION = 'habitLogs';

function DisciplinePageContent() {
    const { user } = useAuth();
    const { habits, addHabit, deleteHabit, isLoaded: habitsLoaded } = useHabits();
    const { dailyLog, toggleHabit, isLoaded: logLoaded } = useDailyHabitLog();
    
    const [monthlyLogs, setMonthlyLogs] = useState<DailyLog[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [monthlyLogsLoaded, setMonthlyLogsLoaded] = useState(false);

    // Effect to fetch logs for the calendar view for the selected month
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
            setMonthlyLogsLoaded(true); // Still set to loaded on error to unblock UI
        });

        return () => unsubscribe();
    }, [user, currentMonth, habitsLoaded]);

    // Combine today's log with the monthly logs for the calendar
    // This ensures the calendar updates instantly when a checkbox is toggled for today's date
    const calendarLogs = useMemo(() => {
        const logsMap = new Map(monthlyLogs.map(log => [format(log.date, 'yyyy-MM-dd'), log]));
        if (dailyLog) {
            logsMap.set(format(dailyLog.date, 'yyyy-MM-dd'), dailyLog);
        }
        return Array.from(logsMap.values());
    }, [monthlyLogs, dailyLog]);


    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Discipline Tracker</h1>
                <p className="text-muted-foreground">
                    Build and track the daily habits that lead to consistent performance.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Today's Checklist</CardTitle>
                    <CardDescription>
                        Check off your habits for today. Your progress is saved automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HabitTracker 
                        habits={habits}
                        addHabit={addHabit}
                        deleteHabit={deleteHabit}
                        habitsLoaded={habitsLoaded}
                        dailyLog={dailyLog}
                        toggleHabit={toggleHabit}
                        logLoaded={logLoaded}
                    />
                </CardContent>
            </Card>

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
                        isLoaded={monthlyLogsLoaded && habitsLoaded}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default function DisciplinePage() {
    return <DisciplinePageContent />;
}
