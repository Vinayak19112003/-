"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useTheme } from "next-themes";
import { format } from 'date-fns';

type EquityCurveChartProps = {
  trades: Trade[];
};

export function EquityCurveChart({ trades }: EquityCurveChartProps) {
    const { theme } = useTheme();

    const data = useMemo(() => {
        let cumulativeR = 0;
        if (trades.length === 0) return [];

        return trades
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((trade, index) => {
                let rValue = 0;
                if (trade.result === 'Win' && trade.rr) {
                    rValue = trade.rr;
                } else if (trade.result === 'Loss') {
                    rValue = -1;
                }
                cumulativeR += rValue;
                return {
                    name: `Trade ${index + 1}`,
                    date: format(trade.date, 'dd MMM'),
                    cumulativeR: parseFloat(cumulativeR.toFixed(2)),
                };
            });
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
        {data.length > 0 ? (
          <div className="h-[300px]">
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
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'R Value', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="cumulativeR" stroke={strokeColor} fillOpacity={1} fill="url(#colorUv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No trade data in selected date range.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
