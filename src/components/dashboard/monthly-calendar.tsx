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

  const firstDay = startOfWeek(startOfMonth(currentDate));
  const lastDay = endOfWeek(endOfMonth(currentDate));
  const calendarDays = eachDayOfInterval({ start: firstDay, end: lastDay });

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

  // This is a proxy for P/L in dollars. Assume 1R = $100 risk.
  const R_TO_DOLLAR_MULTIPLIER = 100;

  return (
    <Card className="lg:col-span-2">
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

        <div className="grid grid-cols-7 border-t border-l border-border">
          {weekdays.map(day => (
            <div key={day} className="p-2 text-center font-semibold text-muted-foreground text-sm border-b border-r border-border bg-muted/50">{day}</div>
          ))}
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const data = dailyData.get(dateKey);
            const isCurrentMonth = isSameMonth(day, currentDate);

            let bgColor = 'bg-card hover:bg-muted/50';
            if (isCurrentMonth && data) {
                if (data.netR > 0.01) bgColor = 'bg-green-500/10 hover:bg-green-500/20';
                else if (data.netR < -0.01) bgColor = 'bg-red-500/10 hover:bg-red-500/20';
                else bgColor = 'bg-blue-500/10 hover:bg-blue-500/20';
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
                           data.netR > 0.01 ? 'text-green-700 dark:text-green-300' :
                           data.netR < -0.01 ? 'text-red-700 dark:text-red-300' :
                           'text-blue-700 dark:text-blue-300'
                        )}>
                            {data.netR >= 0 ? '$' : '-$'}{(Math.abs(data.netR * R_TO_DOLLAR_MULTIPLIER)).toFixed(2)}
                        </p> 
                        <p className="text-xs text-muted-foreground">{data.totalTrades} trade{data.totalTrades !== 1 ? 's' : ''}</p>
                    </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
