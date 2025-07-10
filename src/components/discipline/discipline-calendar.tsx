
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useHabits } from '@/hooks/use-habits';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  isToday,
  startOfDay,
  endOfDay
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

type DailyLogData = {
    date: Date;
    habits: string[];
};

type CalendarData = {
    completionRate: number; // 0 to 1
    completed: number;
    total: number;
};

const HABIT_LOGS_COLLECTION = 'habitLogs';

export function DisciplineCalendar() {
    const { user } = useAuth();
    const { habits: definedHabits, isLoaded: habitsLoaded } = useHabits();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState<DailyLogData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !habitsLoaded) {
            setIsLoading(!habitsLoaded);
            return;
        };

        setIsLoading(true);
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);

        const q = query(
            collection(db, 'users', user.uid, HABIT_LOGS_COLLECTION),
            where('date', '>=', startOfDay(firstDayOfMonth)),
            where('date', '<=', endOfDay(lastDayOfMonth))
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedLogs = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    date: (data.date as Timestamp).toDate(),
                    habits: data.habits || [],
                };
            });
            setLogs(fetchedLogs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching habit logs: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, currentDate, habitsLoaded]);

    const calendarData = useMemo(() => {
        const dataMap = new Map<string, CalendarData>();
        if (definedHabits.length === 0) return dataMap;

        logs.forEach(log => {
            const dateKey = format(log.date, 'yyyy-MM-dd');
            const completedCount = log.habits.length;
            const completionRate = completedCount / definedHabits.length;
            dataMap.set(dateKey, {
                completionRate,
                completed: completedCount,
                total: definedHabits.length,
            });
        });
        return dataMap;
    }, [logs, definedHabits]);
    
    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const firstDayOfGrid = startOfWeek(firstDayOfMonth);
    const lastDayOfGrid = endOfWeek(lastDayOfMonth);
    const calendarDays = eachDayOfInterval({ start: firstDayOfGrid, end: lastDayOfGrid });

    const getCellBgColor = (rate: number | undefined) => {
        if (rate === undefined) return 'bg-card hover:bg-muted/50';
        if (rate >= 0.9) return 'bg-success/50 hover:bg-success/60';
        if (rate >= 0.7) return 'bg-success/30 hover:bg-success/40';
        if (rate >= 0.5) return 'bg-accent/40 hover:bg-accent/50';
        if (rate >= 0.2) return 'bg-destructive/20 hover:bg-destructive/30';
        return 'bg-destructive/40 hover:bg-destructive/50';
    };

    if (isLoading) {
        return <Skeleton className="w-full h-[400px]" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">{format(currentDate, 'MMMM yyyy')}</h4>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <TooltipProvider>
                <div className="grid grid-cols-7 border-t border-l">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center font-semibold text-muted-foreground text-xs sm:text-sm border-r border-b">
                            {day}
                        </div>
                    ))}
                    {calendarDays.map(day => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const data = calendarData.get(dateKey);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const bgColor = data ? getCellBgColor(data.completionRate) : 'bg-card hover:bg-muted/50';
                        const Cell = (
                            <div className={cn(
                                "p-2 flex flex-col justify-start items-start cursor-pointer transition-colors border-r border-b min-h-[90px]",
                                isCurrentMonth ? bgColor : 'bg-muted/30',
                            )}>
                                <span className={cn(
                                    "font-semibold text-sm",
                                    isToday(day) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" :
                                    isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                                )}>
                                    {format(day, 'd')}
                                </span>
                            </div>
                        );

                        if (isCurrentMonth && data) {
                            return (
                                <Tooltip key={dateKey} delayDuration={100}>
                                    <TooltipTrigger asChild>{Cell}</TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-bold">{(data.completionRate * 100).toFixed(0)}% Complete</p>
                                        <p className="text-muted-foreground">{data.completed} of {data.total} habits</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }
                        return <div key={dateKey}>{Cell}</div>
                    })}
                </div>
            </TooltipProvider>
        </div>
    );
}
