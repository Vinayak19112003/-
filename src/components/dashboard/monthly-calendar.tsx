
"use client";

import { useState, useMemo, Fragment } from 'react';
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

type MonthlyCalendarProps = {
  trades: Trade[];
  onDateSelect: (date: Date) => void;
};

type DailyData = {
    netR: number;
    totalTrades: number;
};

export function MonthlyCalendar({ trades, onDateSelect }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const dailyData = useMemo(() => {
    const dataByDate = new Map<string, DailyData>();
    
    trades.forEach(trade => {
        const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
        const dayData = dataByDate.get(dateKey) || { netR: 0, totalTrades: 0 };
        
        dayData.totalTrades += 1;
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

  const weeklyPnl = useMemo(() => {
    const pnlByWeek: number[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        const weekDays = calendarDays.slice(i, i + 7);
        const weeklyTotal = weekDays.reduce((total, day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const data = dailyData.get(dateKey);
            return total + (data?.netR || 0);
        }, 0);
        pnlByWeek.push(weeklyTotal);
    }
    return pnlByWeek;
  }, [calendarDays, dailyData]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Week P&L'];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <h3 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 border-t border-l">
            {weekdays.map((day, index) => (
                <div key={day} className={cn(
                    "p-2 text-center font-semibold text-muted-foreground text-sm border-r border-b",
                    index === 7 && "bg-muted"
                )}>{day}</div>
            ))}
            {calendarDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const data = dailyData.get(dateKey);
                const isCurrentMonth = isSameMonth(day, currentDate);

                let bgColorClass = 'bg-card hover:bg-muted/50';
                if (isCurrentMonth && data?.totalTrades > 0) {
                    if (data.netR > 0.01) bgColorClass = 'bg-success/10 hover:bg-success/20';
                    else if (data.netR < -0.01) bgColorClass = 'bg-destructive/10 hover:bg-destructive/20';
                    else bgColorClass = 'bg-muted/50 hover:bg-muted';
                } else if (!isCurrentMonth) {
                    bgColorClass = 'bg-muted/30';
                }

                const isEndOfWeek = (index + 1) % 7 === 0;
                const weekIndex = Math.floor(index / 7);
                const weekPnlValue = weeklyPnl[weekIndex];

                return (
                <Fragment key={dateKey}>
                    <div
                        className={cn(
                            "p-2 aspect-square flex flex-col justify-between cursor-pointer transition-colors border-r border-b",
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
                            <div className="text-right">
                                <p className={cn(
                                "font-bold text-base",
                                data.netR > 0.01 ? 'text-success' :
                                data.netR < -0.01 ? 'text-destructive' :
                                'text-muted-foreground'
                                )}>
                                    {data.netR > 0 ? '+' : ''}{data.netR.toFixed(2)}R
                                </p> 
                                <p className="text-xs text-muted-foreground">{data.totalTrades} trade{data.totalTrades !== 1 ? 's' : ''}</p>
                            </div>
                        )}
                    </div>
                    {isEndOfWeek && (
                        <div className={cn(
                            "p-2 aspect-square flex flex-col items-center justify-center border-r border-b bg-muted/50"
                        )}>
                           <p className={cn(
                              "font-bold text-base",
                              weekPnlValue > 0.01 ? 'text-success' :
                              weekPnlValue < -0.01 ? 'text-destructive' :
                              'text-muted-foreground'
                            )}>
                                {weekPnlValue > 0 ? '+' : ''}{weekPnlValue.toFixed(2)}R
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
