
"use client";

import { useMemo, useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";

type StrategyChartProps = {
  trades: Trade[];
};

export function StrategyChart({ trades }: StrategyChartProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const data = useMemo(() => {
        const strategyPerformance: { [key: string]: { netR: number, trades: number } } = {};

        trades.forEach(trade => {
            if (!strategyPerformance[trade.strategy]) {
                strategyPerformance[trade.strategy] = { netR: 0, trades: 0 };
            }
            
            let rValue = 0;
            if (trade.result === 'Win') {
                rValue = trade.rr || 0;
            } else if (trade.result === 'Loss') {
                rValue = -1;
            }
            
            strategyPerformance[trade.strategy].netR += rValue;
            strategyPerformance[trade.strategy].trades += 1;
        });

        return Object.entries(strategyPerformance).map(([name, { netR, trades }]) => ({
            name,
            "Net R": parseFloat(netR.toFixed(2)),
            trades
        }));
    }, [trades]);

  const tickColor = theme === 'dark' ? '#888888' : '#333333';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Performance</CardTitle>
        <CardDescription>Net R-value per strategy</CardDescription>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <Skeleton className="h-[300px] w-full" />
        ) : trades.length > 0 ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="Net R" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No trade data to display. Add a trade to see your strategy performance.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
