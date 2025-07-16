
"use client";

import { useMemo, useState, useEffect, memo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useTheme } from "next-themes";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { StreamerModeText } from "../streamer-mode-text";

type DrawdownAnalysisProps = {
  trades: Trade[];
};

export const DrawdownAnalysis = memo(function DrawdownAnalysis({ trades }: DrawdownAnalysisProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data, drawdownStats, maxDrawdownPeriod } = useMemo(() => {
        if (trades.length < 2) {
             return { data: [], drawdownStats: { maxDrawdownR: 0, maxDrawdownPercent: 0 }, maxDrawdownPeriod: null };
        }
        
        let cumulativeR = 0;
        let peakR = 0;
        let maxDrawdownR = 0;
        
        let drawdownStartIndex = 0;
        let maxDrawdownStartIndex = 0;
        let maxDrawdownEndIndex = 0;

        const equityCurve = trades.map((trade, index) => {
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
            maxDrawdownPeriod
        };
    }, [trades]);

  const tickColor = theme === 'dark' ? '#888888' : '#333333';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const strokeColor = 'hsl(var(--primary))';
  const fillColor = 'hsl(var(--primary))';
  const drawdownFillColor = 'hsla(var(--destructive), 0.1)';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drawdown Analysis</CardTitle>
        <CardDescription>Visualizing your equity curve and largest drawdown periods.</CardDescription>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Max Drawdown (R):</span>
                <StreamerModeText as="span" className="font-semibold text-destructive">{drawdownStats.maxDrawdownR}R</StreamerModeText>
            </div>
             <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Max Drawdown (%):</span>
                <StreamerModeText as="span" className="font-semibold text-destructive">{drawdownStats.maxDrawdownPercent}%</StreamerModeText>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <Skeleton className="h-[350px] w-full" />
        ) : data.length > 1 ? (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={fillColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="tradeNumber" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Trade Number', position: 'insideBottom', dy: 10, fill: tickColor, fontSize: 12 }} />
                <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} label={{ value: 'R Value', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 12, dy: 40 }} />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                  contentStyle={{
                    background: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value, name, props) => [`${value}R`, `Cumulative R`]}
                  labelFormatter={(label, payload) => `Trade ${label} (${payload?.[0]?.payload.date || ''})`}
                />
                <Area type="monotone" dataKey="cumulativeR" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
                {maxDrawdownPeriod && (
                    <ReferenceArea
                        x1={maxDrawdownPeriod.x1}
                        x2={maxDrawdownPeriod.x2}
                        y1={0}
                        y2="auto"
                        stroke="hsla(var(--destructive), 0.5)"
                        strokeOpacity={0.3}
                        fill={drawdownFillColor}
                    />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground p-4 text-center">
            Not enough trade data to analyze drawdown. At least 2 trades are required.
          </div>
        )}
      </CardContent>
    </Card>
  );
});
