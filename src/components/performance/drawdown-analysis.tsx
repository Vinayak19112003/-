
"use client";

import { useMemo, useState, useEffect, memo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useTheme } from "next-themes";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { StreamerModeText } from "../streamer-mode-text";
import { LineChart as LineChartIcon } from "lucide-react";

type DrawdownAnalysisProps = {
  trades: Trade[];
};

export const DrawdownAnalysis = memo(function DrawdownAnalysis({ trades }: DrawdownAnalysisProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, drawdownStats, maxDrawdownPeriod, peakRValue } = useMemo(() => {
        if (trades.length < 2) {
             return { data: [], drawdownStats: { maxDrawdownR: 0, maxDrawdownPercent: 0 }, maxDrawdownPeriod: null, peakRValue: 0 };
        }
        
        // Ensure trades are sorted by date
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let cumulativeR = 0;
        let peakR = 0;
        let maxDrawdownR = 0;
        
        let drawdownStartIndex = 0;
        let maxDrawdownStartIndex = 0;
        let maxDrawdownEndIndex = 0;

        const equityCurve = sortedTrades.map((trade, index) => {
            let rValue = 0;
            if (trade.result === 'Win' && trade.rr) {
                rValue = trade.rr;
            } else if (trade.result === 'Loss') {
                rValue = -1;
            }
            cumulativeR += rValue;

            if (cumulativeR > peakR) {
                peakR = cumulativeR;
                drawdownStartIndex = index + 1; // +1 because we have a 'Start' point at index 0
            }

            const drawdown = peakR - cumulativeR;
            if (drawdown > maxDrawdownR) {
                maxDrawdownR = drawdown;
                maxDrawdownStartIndex = drawdownStartIndex;
                maxDrawdownEndIndex = index + 1;
            }

            return {
                tradeNumber: index + 1,
                date: format(new Date(trade.date), 'dd MMM'),
                cumulativeR: parseFloat(cumulativeR.toFixed(2)),
            };
        });
        
        const maxDrawdownPercent = peakR > 0 ? (maxDrawdownR / peakR) * 100 : 0;
        
        // Add a starting point at 0
        const data = [{ tradeNumber: 0, date: 'Start', cumulativeR: 0 }, ...equityCurve];

        const maxDrawdownPeriod = maxDrawdownEndIndex > maxDrawdownStartIndex
            ? { x1: maxDrawdownStartIndex, x2: maxDrawdownEndIndex }
            : null;

        return {
            data,
            drawdownStats: {
                maxDrawdownR: parseFloat(maxDrawdownR.toFixed(2)),
                maxDrawdownPercent: parseFloat(maxDrawdownPercent.toFixed(2)),
            },
            maxDrawdownPeriod,
            peakRValue: peakR,
        };
    }, [trades]);

  const tickColor = theme === 'dark' ? '#888888' : '#333333';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const strokeColor = 'hsl(var(--primary))';
  const fillColor = 'hsl(var(--primary))';
  const drawdownFillColor = 'hsla(var(--destructive), 0.1)';

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            Drawdown Analysis
        </CardTitle>
        <CardDescription>
            Visualizing your equity curve and largest drawdown periods.
            Max drawdown (R): <StreamerModeText as="span" className="font-semibold text-destructive">{drawdownStats.maxDrawdownR}R</StreamerModeText>
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {!mounted ? (
          <Skeleton className="h-full w-full" />
        ) : data.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={fillColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="tradeNumber" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value: any, name: any) => [`${value}R`, `Cumulative R`]}
                  labelFormatter={(label: any, payload: any) => `Trade ${label} (${payload?.[0]?.payload.date || ''})`}
                />
                <Area type="monotone" dataKey="cumulativeR" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" dot={false}/>
                {maxDrawdownPeriod && (
                    <ReferenceArea
                        x1={maxDrawdownPeriod.x1}
                        x2={maxDrawdownPeriod.x2}
                        y1={0}
                        y2={peakRValue * 1.1} // Ensure it covers the chart area
                        stroke="hsla(var(--destructive), 0)"
                        fill={drawdownFillColor}
                        ifOverflow="visible"
                    />
                )}
              </AreaChart>
            </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
            Not enough trade data to analyze drawdown. At least 2 trades are required.
          </div>
        )}
      </CardContent>
    </Card>
  );
});
