
"use client";

import { useMemo, useState, useEffect } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useTheme } from "next-themes";
import { format, startOfDay } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";

type EquityCurveChartProps = {
  trades: Trade[];
};

export function EquityCurveChart({ trades }: EquityCurveChartProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const data = useMemo(() => {
        if (trades.length === 0) return [];
        
        let cumulativeR = 0;
        const dailyNetR: { [date: string]: number } = {};

        // Sort trades by date to process them chronologically
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sortedTrades.forEach(trade => {
            const dateKey = format(startOfDay(new Date(trade.date)), 'yyyy-MM-dd');
            if (!dailyNetR[dateKey]) {
                dailyNetR[dateKey] = 0;
            }
            let rValue = 0;
            if (trade.result === 'Win' && trade.rr) {
                rValue = trade.rr;
            } else if (trade.result === 'Loss') {
                rValue = -1;
            }
            dailyNetR[dateKey] += rValue;
        });

        const chartData = Object.keys(dailyNetR)
            .sort()
            .map(dateKey => {
                cumulativeR += dailyNetR[dateKey];
                return {
                    date: format(new Date(dateKey), 'dd MMM'),
                    cumulativeR: parseFloat(cumulativeR.toFixed(2)),
                };
            });
        
        // Add a starting point at 0
        return [{ date: 'Start', cumulativeR: 0 }, ...chartData];

    }, [trades]);

  const tickColor = theme === 'dark' ? '#888888' : '#333333';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const strokeColor = 'hsl(var(--primary))';
  const fillColor = 'hsl(var(--primary))';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Curve (Cumulative R)</CardTitle>
        <CardDescription>Your trading performance over time.</CardDescription>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <Skeleton className="h-[400px] w-full" />
        ) : data.length > 1 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={fillColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} label={{ value: 'R Value', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 12, dy: 40 }} />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="cumulativeR" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground p-4 text-center">
            No trade data in the selected date range to display chart.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
