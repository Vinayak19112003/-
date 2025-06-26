
"use client";

import { useMemo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import ActivityCalendar, { type Activity, type ThemedReactActivityCalendar } from 'react-activity-calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type TradeCalendarProps = {
  trades: Trade[];
  onDateSelect: (date: Date) => void;
};

// We extend the Activity type to include our custom data for the tooltip
type TradeActivity = Activity & {
  netR: number;
  avgRr: number;
  totalTrades: number;
  wins: number;
  losses: number;
};

export function TradeCalendar({ trades, onDateSelect }: TradeCalendarProps) {
  const { theme } = useTheme();

  const data: TradeActivity[] = useMemo(() => {
    const dataByDate = new Map<string, { netR: number; totalTrades: number; wins: number; losses: number; totalWinningR: number }>();
    
    trades.forEach(trade => {
        const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
        const dayData = dataByDate.get(dateKey) || { netR: 0, totalTrades: 0, wins: 0, losses: 0, totalWinningR: 0 };
        
        dayData.totalTrades += 1;
        if (trade.result === 'Win') {
            dayData.wins += 1;
            dayData.netR += trade.rr || 0;
            dayData.totalWinningR += trade.rr || 0;
        } else if (trade.result === 'Loss') {
            dayData.losses += 1;
            dayData.netR -= 1;
        }
        dataByDate.set(dateKey, dayData);
    });

    return Array.from(dataByDate.entries()).map(([date, dayData]) => {
      let level;
      if (dayData.netR > 1.5) level = 4;        // Great profit
      else if (dayData.netR > 0) level = 3;     // Good profit
      else if (dayData.netR === 0) level = 2;   // Break-even
      else if (dayData.netR < -1) level = 0;    // Big loss
      else level = 1;                           // Small loss

      const avgRr = dayData.wins > 0 ? dayData.totalWinningR / dayData.wins : 0;

      return {
        date,
        count: dayData.totalTrades,
        level: level as 0 | 1 | 2 | 3 | 4,
        netR: dayData.netR,
        totalTrades: dayData.totalTrades,
        wins: dayData.wins,
        losses: dayData.losses,
        avgRr,
      };
    });
  }, [trades]);

  const explicitTheme: ThemedReactActivityCalendar = {
    light: ['hsl(var(--destructive) / 0.8)', 'hsl(var(--destructive) / 0.4)', 'hsl(var(--muted))', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.8)'],
    dark: ['hsl(var(--destructive) / 0.7)', 'hsl(var(--destructive) / 0.4)', 'hsl(var(--muted) / 0.5)', 'hsl(var(--primary) / 0.4)', 'hsl(var(--primary) / 0.7)'],
  };

  const handleClick = (activity: Activity | null) => {
    if (activity?.count > 0) {
      onDateSelect(parseISO(activity.date));
    }
  };

  const Legend = () => (
    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground w-full">
      <span>Loss</span>
      <ul className="flex gap-1">
        <li className="h-3 w-3 rounded-sm" style={{ backgroundColor: theme === 'dark' ? explicitTheme.dark[1] : explicitTheme.light[1] }} />
        <li className="h-3 w-3 rounded-sm" style={{ backgroundColor: theme === 'dark' ? explicitTheme.dark[2] : explicitTheme.light[2] }} />
        <li className="h-3 w-3 rounded-sm" style={{ backgroundColor: theme === 'dark' ? explicitTheme.dark[3] : explicitTheme.light[3] }} />
        <li className="h-3 w-3 rounded-sm" style={{ backgroundColor: theme === 'dark' ? explicitTheme.dark[4] : explicitTheme.light[4] }} />
      </ul>
      <span>Profit</span>
    </div>
  );

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Trade Calendar</CardTitle>
        <CardDescription>Daily performance heatmap. Click a day to filter trades.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-0">
        <div className="min-w-[700px] pr-4">
            <ActivityCalendar
            data={data}
            theme={explicitTheme}
            colorScheme={theme === 'dark' ? 'dark' : 'light'}
            blockSize={14}
            blockMargin={4}
            fontSize={14}
            showWeekdayLabels
            eventHandlers={{
                onClick: activity => () => {
                    handleClick(activity);
                },
            }}
            renderBlock={(block, activity) => (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>{block}</TooltipTrigger>
                        <TooltipContent>
                            {activity.count > 0 ? (
                                <div className="space-y-1 text-sm">
                                    <p className="font-bold">{format(parseISO(activity.date), "PPP")}</p>
                                    <p>Net R: <span className={cn('font-semibold', (activity as TradeActivity).netR > 0 ? 'text-primary' : (activity as TradeActivity).netR < 0 ? 'text-destructive' : '')}>{(activity as TradeActivity).netR.toFixed(2)}</span></p>
                                    <p>Avg. RR: {(activity as TradeActivity).avgRr.toFixed(2)}</p>
                                    <p>Total Trades: {(activity as TradeActivity).totalTrades}</p>
                                    <p>W/L: {(activity as TradeActivity).wins}/{(activity as TradeActivity).losses}</p>
                                </div>
                            ) : (
                                <p className="text-sm">{format(parseISO(activity.date), "PPP")} - No Trades</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            />
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 px-6">
        <Legend />
      </CardFooter>
    </Card>
  );
}
