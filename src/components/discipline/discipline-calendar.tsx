
'use client';

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
  isToday
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { DailyLog } from '@/hooks/use-daily-habit-log';
import { HabitHistory } from '@/hooks/use-habits';
import { useMemo } from 'react';

type CalendarData = {
    completionRate: number; // 0 to 1
    completed: number;
    total: number;
};

interface DisciplineCalendarProps {
    logs: DailyLog[];
    habitHistory: HabitHistory[];
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    isLoaded: boolean;
}

export function DisciplineCalendar({ 
    logs, 
    habitHistory, 
    currentMonth, 
    setCurrentMonth,
    isLoaded
}: DisciplineCalendarProps) {

    const calendarData = useMemo(() => {
        const dataMap = new Map<string, CalendarData>();
        if (habitHistory.length === 0 || !isLoaded) return dataMap;

        const sortedHistory = [...habitHistory].sort((a, b) => a.date.getTime() - b.date.getTime());

        // This function finds the list of habits that were active on a given date.
        const getHabitsForDate = (date: Date): string[] => {
            let applicableHabits: string[] = [];
            // Find the latest history entry that is on or before the given date.
            for (const historyEntry of sortedHistory) {
                if (historyEntry.date <= date) {
                    applicableHabits = historyEntry.habits;
                } else {
                    // Since history is sorted, we can break early.
                    break;
                }
            }
            return applicableHabits;
        };

        const firstDay = startOfWeek(startOfMonth(currentMonth));
        const lastDay = endOfWeek(endOfMonth(currentMonth));
        const daysInView = eachDayOfInterval({ start: firstDay, end: lastDay });

        daysInView.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const habitsOnDate = getHabitsForDate(day);
            const total = habitsOnDate.length;

            // Don't calculate for days before any habits were created or if no habits were defined.
            if (total === 0 || day < sortedHistory[0].date) return;
            
            const log = logs.find(l => l.id === dateKey);
            // We only count habits as completed if they existed on that day.
            const completed = log ? log.habits.filter(h => habitsOnDate.includes(h)).length : 0;
            
            // This prevents division by zero
            const completionRate = total > 0 ? completed / total : 0;
            
            dataMap.set(dateKey, {
                completionRate,
                completed,
                total
            });
        });

        return dataMap;
    }, [logs, habitHistory, currentMonth, isLoaded]);
    
    const firstDayOfGrid = startOfWeek(startOfMonth(currentMonth));
    const lastDayOfGrid = endOfWeek(endOfMonth(currentMonth));
    const calendarDays = eachDayOfInterval({ start: firstDayOfGrid, end: lastDayOfGrid });

    const getCellBgColor = (rate: number | undefined) => {
        if (rate === undefined) return 'bg-card hover:bg-muted/50';
        if (rate >= 0.99) return 'bg-success/50 hover:bg-success/60';
        if (rate >= 0.7) return 'bg-success/30 hover:bg-success/40';
        if (rate >= 0.5) return 'bg-accent/40 hover:bg-accent/50';
        if (rate > 0) return 'bg-destructive/20 hover:bg-destructive/30';
        return 'bg-destructive/40 hover:bg-destructive/50';
    };

    if (!isLoaded) {
        return <Skeleton className="w-full h-[400px]" />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h4>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-8 w-8">
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
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        
                        // Use a default background for days with no data
                        const bgColor = data ? getCellBgColor(data.completionRate) : 'bg-card hover:bg-muted/50';
                        
                        const Cell = (
                            <div className={cn(
                                "p-2 flex flex-col justify-start items-start transition-colors border-r border-b min-h-[90px]",
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
