
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
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DailyLog } from '@/hooks/use-daily-habit-log';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

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
    const { habits, addHabit, deleteHabit, isLoaded: habitsLoaded, habitHistory } = useHabits();
    
    const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [allLogsLoaded, setAllLogsLoaded] = useState(false);
    
    const { toggleHabit, isLoaded: logHookLoaded } = useDailyHabitLog();

    // Effect to fetch all logs for the user once
    useEffect(() => {
        if (!user || !habitsLoaded) return;

        setAllLogsLoaded(false);
        
        const q = query(collection(db, 'users', user.uid, HABIT_LOGS_COLLECTION));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    date: (data.date as Timestamp).toDate(),
                    habits: data.habits || [],
                };
            });
            setAllLogs(logs);
            setAllLogsLoaded(true);
        }, (error) => {
            console.error("Error fetching all logs: ", error);
            setAllLogsLoaded(true); // Still set to loaded on error to unblock UI
        });

        return () => unsubscribe();
    }, [user, habitsLoaded]);

    const dailyLogForToday = useMemo(() => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        return allLogs.find(log => log.id === todayKey) || null;
    }, [allLogs]);

    const monthlyLogsForCalendar = useMemo(() => {
        const firstDay = startOfMonth(currentMonth);
        const lastDay = endOfMonth(currentMonth);
        return allLogs.filter(log => {
            const logDate = log.date;
            return logDate >= firstDay && logDate <= lastDay;
        });
    }, [allLogs, currentMonth]);

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
                        dailyLog={dailyLogForToday}
                        toggleHabit={toggleHabit}
                        logLoaded={allLogsLoaded && logHookLoaded}
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
                        logs={monthlyLogsForCalendar}
                        habitHistory={habitHistory}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        isLoaded={allLogsLoaded && habitsLoaded}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

export default function DisciplinePage() {
    return <DisciplinePageContent />;
}
