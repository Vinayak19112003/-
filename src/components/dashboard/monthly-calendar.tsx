
"use client";

import { useState, useMemo, Fragment, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

type MonthlyCalendarProps = {
  trades: Trade[];
  onDateSelect: (date: Date) => void;
};

type DailyData = {
    netR: number;
    totalTrades: number;
    pnl: number;
};

export function MonthlyCalendar({ trades, onDateSelect }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const dailyData = useMemo(() => {
    const dataByDate = new Map<string, DailyData>();
    
    trades.forEach(trade => {
        const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
        const dayData = dataByDate.get(dateKey) || { netR: 0, totalTrades: 0, pnl: 0 };
        
        dayData.totalTrades += 1;
        dayData.pnl += trade.pnl || 0;
        
        if (trade.result === 'Win') {
            dayData.netR += trade.rr || 0;
        } else if (trade.result === 'Loss') {
            dayData.netR -= 1;
        }
        dataByDate.set(dateKey, dayData);
    });

    return dataByDate;
  }, [trades]);

  const firstDayOfGrid = startOfWeek(startOfMonth(currentDate));
  const lastDayOfGrid = endOfWeek(endOfMonth(currentDate));
  const calendarDays = eachDayOfInterval({ start: firstDayOfGrid, end: lastDayOfGrid });

  const weeklyTotals = useMemo(() => {
    const totalsByWeek: { pnl: number; netR: number }[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const weekDays = calendarDays.slice(i, i + 7);
      const weeklyTotal = weekDays.reduce(
        (totals, day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const data = dailyData.get(dateKey);
          totals.pnl += data?.pnl || 0;
          totals.netR += data?.netR || 0;
          return totals;
        },
        { pnl: 0, netR: 0 }
      );
      totalsByWeek.push(weeklyTotal);
    }
    return totalsByWeek;
  }, [calendarDays, dailyData]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const weekdays = isMobile 
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'P&L'] 
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Week P&L'];

  if (!mounted) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-7 w-40" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </CardHeader>
            <CardContent className="p-2">
                <Skeleton className="h-80 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-lg sm:text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-8 border-t border-l">
            {weekdays.map((day) => (
                <div key={day} className={cn(
                    "p-1 text-center font-semibold text-muted-foreground text-[10px] sm:text-xs border-r border-b",
                    day === 'P&L' && "bg-muted/50"
                )}>{day}</div>
            ))}
            {calendarDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const data = dailyData.get(dateKey);
                const isCurrentMonth = isSameMonth(day, currentDate);

                let bgColorClass = 'bg-card hover:bg-muted/50';
                if (isCurrentMonth && data?.totalTrades > 0) {
                    if (data.pnl > 0) bgColorClass = 'bg-success/10 hover:bg-success/20';
                    else if (data.pnl < 0) bgColorClass = 'bg-destructive/10 hover:bg-destructive/20';
                    else bgColorClass = 'bg-muted/50 hover:bg-muted';
                } else if (!isCurrentMonth) {
                    bgColorClass = 'bg-muted/30';
                }

                const isEndOfWeek = (index + 1) % 7 === 0;
                const weekIndex = Math.floor(index / 7);

                return (
                <Fragment key={dateKey}>
                    <div
                        className={cn(
                            "p-1 aspect-square flex flex-col justify-between cursor-pointer transition-colors border-r border-b",
                            bgColorClass,
                        )}
                        onClick={() => onDateSelect(day)}
                    >
                        <span className={cn(
                            "font-semibold text-[10px] sm:text-xs",
                            isToday(day) ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center" : 
                            isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                            {format(day, 'd')}
                        </span>
                        {isCurrentMonth && data && (
                            <div className="text-right space-y-0.5">
                                <p className={cn(
                                "font-bold text-[10px] sm:text-xs",
                                data.pnl > 0 ? 'text-success' :
                                data.pnl < 0 ? 'text-destructive' :
                                'text-muted-foreground'
                                )}>
                                    {data.pnl >= 0 ? '+$' : '-$'}{Math.abs(data.pnl).toFixed(isMobile ? 0 : 1)}
                                </p> 
                                <p className={cn(
                                "font-semibold text-[9px] sm:text-[10px]",
                                data.netR > 0 ? 'text-success/80' :
                                data.netR < 0 ? 'text-destructive/80' :
                                'text-muted-foreground'
                                )}>
                                    {data.netR.toFixed(1)}R
                                </p> 
                            </div>
                        )}
                    </div>
                    {isEndOfWeek && (
                        <div className={cn(
                            "p-1 aspect-square flex flex-col items-center justify-center border-r border-b bg-muted/50"
                        )}>
                           <p className={cn(
                              "font-bold text-xs sm:text-sm",
                              weeklyTotals[weekIndex].pnl > 0 ? 'text-success' :
                              weeklyTotals[weekIndex].pnl < 0 ? 'text-destructive' :
                              'text-muted-foreground'
                            )}>
                                {weeklyTotals[weekIndex].pnl >= 0 ? '+$' : '-$'}{Math.abs(weeklyTotals[weekIndex].pnl).toFixed(isMobile ? 0 : 0)}
                            </p>
                            <p className={cn(
                              "font-semibold text-[9px] sm:text-[10px]",
                               weeklyTotals[weekIndex].netR > 0 ? 'text-success/80' :
                               weeklyTotals[weekIndex].netR < 0 ? 'text-destructive/80' :
                               'text-muted-foreground'
                            )}>
                                {weeklyTotals[weekIndex].netR.toFixed(1)}R
                            </p>
                        </div>
                    )}
                </Fragment>
                );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
