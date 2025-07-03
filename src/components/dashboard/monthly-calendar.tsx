
"use client";

import { useState, useMemo, Fragment, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { StreamerModeText } from '@/components/streamer-mode-text';

type MonthlyCalendarProps = {
  trades: Trade[];
  onDateSelect: (date: Date) => void;
};

type DailyData = {
    netR: number;
    totalTrades: number;
    pnl: number;
    wins: number;
    losses: number;
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
        const dayData = dataByDate.get(dateKey) || { netR: 0, totalTrades: 0, pnl: 0, wins: 0, losses: 0 };
        
        dayData.totalTrades += 1;
        dayData.pnl += trade.pnl || 0;
        
        if (trade.result === 'Win') {
            dayData.wins += 1;
            dayData.netR += trade.rr || 0;
        } else if (trade.result === 'Loss') {
            dayData.losses += 1;
            dayData.netR -= 1;
        }
        dataByDate.set(dateKey, dayData);
    });

    return dataByDate;
  }, [trades]);

  const firstDayOfGrid = startOfWeek(startOfMonth(currentDate));
  const lastDayOfGrid = endOfWeek(endOfMonth(currentDate));
  const calendarDays = eachDayOfInterval({ start: firstDayOfGrid, end: lastDayOfGrid });

  const weeks = useMemo(() => {
    const weekChunks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weekChunks.push(calendarDays.slice(i, i + 7));
    }
    return weekChunks;
  }, [calendarDays]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const weekdays = isMobile 
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] 
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const showWeeklyPnl = !isMobile;
  const gridColsClass = showWeeklyPnl ? 'grid-cols-8' : 'grid-cols-7';


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
                <Skeleton className="h-[450px] w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-lg sm:text-xl font-semibold font-headline">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 flex-1">
        <TooltipProvider>
        <div className={cn("grid border-t border-l h-full", gridColsClass)}>
            {weekdays.map((day) => (
                <div key={day} className="p-1 text-center font-semibold text-muted-foreground text-xs sm:text-sm border-r border-b">
                    {day}
                </div>
            ))}
            {showWeeklyPnl && (
                <div className="p-1 text-center font-semibold text-muted-foreground text-xs sm:text-sm border-r border-b">
                    Weekly
                </div>
            )}
            {weeks.map((week, weekIndex) => {
                const { pnl, netR } = week.reduce(
                    (totals, day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const data = dailyData.get(dateKey);
                        if (data) {
                            totals.pnl += data.pnl;
                            totals.netR += data.netR;
                        }
                        return totals;
                    },
                    { pnl: 0, netR: 0 }
                );
                return (
                    <Fragment key={weekIndex}>
                        {week.map((day) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const data = dailyData.get(dateKey);
                            const isCurrentMonth = isSameMonth(day, currentDate);

                            let bgColorClass = 'bg-card hover:bg-muted/50';
                            if (isCurrentMonth && data?.totalTrades) {
                                if (data.pnl > 0) bgColorClass = 'bg-success/10 hover:bg-success/20';
                                else if (data.pnl < 0) bgColorClass = 'bg-destructive/10 hover:bg-destructive/20';
                                else bgColorClass = 'bg-muted/50 hover:bg-muted';
                            } else if (!isCurrentMonth) {
                                bgColorClass = 'bg-muted/30';
                            }

                            const DayCell = (
                                <div
                                    className={cn(
                                        "p-2 flex flex-col justify-between cursor-pointer transition-colors border-r border-b h-full min-h-[120px]",
                                        bgColorClass,
                                    )}
                                    onClick={() => onDateSelect(day)}
                                >
                                    <span className={cn(
                                        "font-semibold text-sm",
                                        isToday(day) ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : 
                                        isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {isCurrentMonth && data && (
                                        <div className="text-right space-y-1">
                                            <StreamerModeText>
                                                <p className={cn(
                                                "font-bold text-sm",
                                                data.pnl > 0 ? 'text-success' :
                                                data.pnl < 0 ? 'text-destructive' :
                                                'text-muted-foreground'
                                                )}>
                                                    {data.pnl >= 0 ? '+$' : '-$'}{Math.abs(data.pnl).toFixed(1)}
                                                </p> 
                                            </StreamerModeText>
                                            <p className={cn(
                                            "font-semibold text-xs",
                                            data.netR > 0 ? 'text-success/80' :
                                            data.netR < 0 ? 'text-destructive/80' :
                                            'text-muted-foreground'
                                            )}>
                                                {data.netR.toFixed(1)}R
                                            </p> 
                                        </div>
                                    )}
                                </div>
                            )

                            if (isCurrentMonth && data) {
                                return (
                                    <Tooltip key={dateKey} delayDuration={100}>
                                        <TooltipTrigger asChild>{DayCell}</TooltipTrigger>
                                        <TooltipContent>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                <span className="font-semibold">P&L:</span>
                                                <span className={cn(data.pnl > 0 ? 'text-success' : data.pnl < 0 ? 'text-destructive' : '')}>
                                                   <StreamerModeText>{data.pnl.toFixed(2)}</StreamerModeText>
                                                </span>
                                                <span className="font-semibold">Net R:</span>
                                                <span>{data.netR.toFixed(2)}</span>
                                                <span className="font-semibold">Trades:</span>
                                                <span>{data.totalTrades}</span>
                                                <span className="font-semibold">Wins:</span>
                                                <span className="text-success">{data.wins}</span>
                                                <span className="font-semibold">Losses:</span>
                                                <span className="text-destructive">{data.losses}</span>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            }

                            return (
                                <Fragment key={dateKey}>{DayCell}</Fragment>
                            );
                        })}
                        {showWeeklyPnl && (
                            <div className="p-1.5 flex flex-col justify-center items-center text-center border-r border-b h-full bg-muted/20">
                                <p className="text-xs text-muted-foreground font-semibold">Total</p>
                                <StreamerModeText>
                                    <p className={cn(
                                        "font-bold text-base",
                                        pnl > 0 ? 'text-success' : pnl < 0 ? 'text-destructive' : 'text-muted-foreground'
                                    )}>
                                        {pnl >= 0 ? '+$' : '-$'}{Math.abs(pnl).toFixed(1)}
                                    </p>
                                </StreamerModeText>
                                <p className={cn(
                                    "font-semibold text-sm",
                                    netR > 0 ? 'text-success/80' : netR < 0 ? 'text-destructive/80' : 'text-muted-foreground'
                                )}>
                                    {netR.toFixed(1)}R
                                </p>
                            </div>
                        )}
                    </Fragment>
                );
            })}
        </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
