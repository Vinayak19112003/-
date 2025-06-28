
"use client";

import { useState, useMemo } from 'react';
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

  const monthlyStats = useMemo(() => {
    let netR = 0;
    const tradingDays = new Set<string>();
    dailyData.forEach((data, dateKey) => {
        const day = new Date(dateKey);
        // Ensure we are only calculating for the current month in view
        if (isSameMonth(day, currentDate)) {
            netR += data.netR;
            if (data.totalTrades > 0) {
              tradingDays.add(dateKey);
            }
        }
    });
    return { netR, tradingDays: tradingDays.size };
  }, [dailyData, currentDate]);

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
        const tradingDaysInWeek = new Set<string>();

        week.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const data = dailyData.get(dateKey);
            if (data && data.totalTrades > 0 && isSameMonth(day, currentDate)) {
                netR += data.netR;
                tradingDaysInWeek.add(dateKey);
            }
        });

        return {
            weekNumber: index + 1,
            netR,
            tradingDays: tradingDaysInWeek.size,
        };
    });
  }, [calendarWeeks, dailyData, currentDate]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-xl font-semibold text-center min-w-[150px]">{format(currentDate, 'MMMM yyyy')}</h3>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="text-center sm:text-right">
                <div className="text-sm text-muted-foreground">Monthly Net R</div>
                <div className={cn(
                    "text-lg font-bold",
                    monthlyStats.netR > 0.01 ? "text-primary" :
                    monthlyStats.netR < -0.01 ? "text-destructive" :
                    "text-foreground"
                )}>
                    {monthlyStats.netR.toFixed(2)}R
                    <span className="text-sm font-normal text-muted-foreground ml-2">({monthlyStats.tradingDays} days)</span>
                </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="grid grid-cols-7">
            {weekdays.map(day => (
                <div key={day} className="p-2 text-center font-semibold text-muted-foreground text-sm">{day}</div>
            ))}
        </div>
        <div className="border-t border-l rounded-tl-lg">
          {calendarWeeks.map((week, index) => {
              const summary = weeklySummaries[index];
              return (
                  <div key={index} className="flex flex-col lg:flex-row items-stretch border-b last:border-b-0">
                      <div className="grid grid-cols-7 flex-1">
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
                                      "p-2 aspect-square flex flex-col justify-between cursor-pointer transition-colors border-r",
                                      bgColor,
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
                                          "font-bold text-lg",
                                          data.netR > 0.01 ? 'text-primary' :
                                          data.netR < -0.01 ? 'text-destructive' :
                                          'text-muted-foreground'
                                          )}>
                                              {data.netR > 0 ? '+' : ''}{data.netR.toFixed(2)}R
                                          </p> 
                                          <p className="text-xs text-muted-foreground">{data.totalTrades} trade{data.totalTrades !== 1 ? 's' : ''}</p>
                                      </div>
                                  )}
                              </div>
                              );
                          })}
                      </div>
                      <div className="w-full lg:w-48 flex-shrink-0 border-r lg:border-l p-4 flex flex-col justify-center text-center bg-card">
                          <p className="text-sm font-medium text-muted-foreground">Week {summary.weekNumber}</p>
                          <p className={cn(
                              "text-2xl font-bold font-headline",
                              summary.netR > 0.01 ? 'text-primary' : 
                              summary.netR < -0.01 ? 'text-destructive' :
                              'text-foreground'
                          )}>
                              {summary.netR > 0 ? '+' : ''}{summary.netR.toFixed(2)}R
                          </p>
                          <Badge variant="secondary" className="mx-auto mt-1">{summary.tradingDays} trading days</Badge>
                      </div>
                  </div>
              );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
