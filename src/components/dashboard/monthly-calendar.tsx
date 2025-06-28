
"use client";

import { useState, useMemo } from 'react';
import type { Trade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  endOfWeek
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  
  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    if (calendarDays.length === 0) return [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);
  
  const weeklySummaries = useMemo(() => {
    return calendarWeeks.map((week, index) => {
        let netR = 0;
        const tradingDaysWithTrades = new Set<string>();

        week.forEach(day => {
            if (isSameMonth(day, currentDate)) {
                const dateKey = format(day, 'yyyy-MM-dd');
                const data = dailyData.get(dateKey);
                if (data && data.totalTrades > 0) {
                    netR += data.netR;
                    tradingDaysWithTrades.add(dateKey);
                }
            }
        });

        return {
            weekNumber: index + 1,
            netR,
            tradingDays: tradingDaysWithTrades.size,
        };
    });
  }, [calendarWeeks, dailyData, currentDate]);


  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleYearChange = (year: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
  };
  
  const currentYear = currentDate.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle>Trade Calendar</CardTitle>
                <CardDescription>Monthly performance view. Click a day to filter trades.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Year:</span>
                <div className="flex items-center gap-1 rounded-md border p-1 bg-background">
                    {years.map(year => (
                        <Button
                            key={year}
                            variant={year === currentYear ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => handleYearChange(year)}
                            className="px-2 h-8"
                        >
                            {year}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h3>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
        </div>

        <div>
            <div className="grid grid-cols-7 border-t border-l border-border">
                {weekdays.map(day => (
                    <div key={day} className="p-2 text-center font-semibold text-muted-foreground text-sm border-b border-r border-border bg-muted/50">{day}</div>
                ))}
            </div>
            {calendarWeeks.map((week, index) => {
                const summary = weeklySummaries[index];
                return (
                    <div key={index} className="flex flex-col lg:flex-row">
                        <div className="grid grid-cols-7 flex-1 border-l border-border">
                            {week.map(day => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const data = dailyData.get(dateKey);
                                const isCurrentMonth = isSameMonth(day, currentDate);

                                let bgColor = 'bg-card hover:bg-muted/50';
                                if (isCurrentMonth && data && data.totalTrades > 0) {
                                    if (data.netR > 0.01) bgColor = 'bg-primary/10 hover:bg-primary/20';
                                    else if (data.netR < -0.01) bgColor = 'bg-destructive/10 hover:bg-destructive/20';
                                    else bgColor = 'bg-muted/50 hover:bg-muted';
                                } else if (!isCurrentMonth) {
                                    bgColor = 'bg-muted/30';
                                }

                                return (
                                <div
                                    key={dateKey}
                                    className={cn(
                                    "p-2 aspect-video flex flex-col justify-between cursor-pointer transition-colors border-b border-r border-border",
                                    bgColor,
                                    )}
                                    onClick={() => onDateSelect(day)}
                                >
                                    <span className={cn("font-semibold", isCurrentMonth ? "text-foreground" : "text-muted-foreground/50")}>
                                        {format(day, 'd')}
                                    </span>
                                    {isCurrentMonth && data && (
                                        <div className="text-right text-sm">
                                            <p className={cn(
                                            "font-bold",
                                            data.netR > 0.01 ? 'text-primary' :
                                            data.netR < -0.01 ? 'text-destructive' :
                                            'text-muted-foreground'
                                            )}>
                                                {data.netR.toFixed(2)}R
                                            </p> 
                                            <p className="text-xs text-muted-foreground">{data.totalTrades} trade{data.totalTrades !== 1 ? 's' : ''}</p>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                        <div className="w-full lg:w-48 flex-shrink-0 border-b border-r border-l border-border bg-card">
                            <div className="p-3 flex items-center justify-between lg:flex-col lg:items-start lg:justify-center h-full gap-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Week {summary.weekNumber}</p>
                                    <p className={cn(
                                        "text-2xl font-bold font-headline",
                                        summary.netR > 0.01 ? 'text-primary' : 
                                        summary.netR < -0.01 ? 'text-destructive' :
                                        'text-foreground'
                                    )}>
                                        {summary.netR > 0 ? '+' : ''}{summary.netR.toFixed(2)}R
                                    </p>
                                </div>
                                <Badge variant="secondary">{summary.tradingDays} trading days</Badge>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
