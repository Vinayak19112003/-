
"use client";

import { useMemo, useState, useEffect } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Trade } from '@/lib/types';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type PerformanceRadarChartProps = {
  trades: Trade[];
};

export function PerformanceRadarChart({ trades }: PerformanceRadarChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    // Don't show chart if there isn't enough data
    if (totalTrades < 3) {
      return null;
    }

    // --- Basic Stats ---
    const wins = trades.filter((t) => t.result === 'Win');
    const losses = trades.filter((t) => t.result === 'Loss');
    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;

    const grossProfit = wins.reduce((acc, t) => acc + (t.rr || 0), 0);
    const grossLoss = lossCount; // Each loss is -1R
    const netProfit = grossProfit - grossLoss;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgWin = winCount > 0 ? grossProfit / winCount : 0;
    const lossRate = 1 - winRate / 100;
    const expectancy = (winRate / 100) * avgWin - lossRate * 1;

    // --- Cumulative & Drawdown Stats ---
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulativeR = 0;
    let peakR = 0;
    let maxDrawdownR = 0;
    const dailyNetR: { [date: string]: number } = {};

    for (const trade of sortedTrades) {
      const dateKey = format(new Date(trade.date), 'yyyy-MM-dd');
      dailyNetR[dateKey] = dailyNetR[dateKey] || 0;

      let rValue = 0;
      if (trade.result === 'Win') rValue = trade.rr || 0;
      else if (trade.result === 'Loss') rValue = -1;

      cumulativeR += rValue;
      dailyNetR[dateKey] += rValue;

      if (cumulativeR > peakR) {
        peakR = cumulativeR;
      }
      const drawdown = peakR - cumulativeR;
      if (drawdown > maxDrawdownR) {
        maxDrawdownR = drawdown;
      }
    }
    
    const maxDrawdownPercent = peakR > 0 ? (maxDrawdownR / peakR) * 100 : 0;
    const recoveryFactor = maxDrawdownR > 0 ? netProfit / maxDrawdownR : netProfit > 0 ? Infinity : 0;

    // --- Consistency Stats ---
    const tradingDays = Object.values(dailyNetR);
    const greenDays = tradingDays.filter((netR) => netR > 0).length;
    const consistency = tradingDays.length > 0 ? (greenDays / tradingDays.length) * 100 : 0;

    // --- Normalization for Radar Chart ---
    const normalize = (value: number, max: number) => Math.min(Math.max((value / max) * 100, 0), 100);
    const normalizeInverted = (value: number, max: number) => 100 - normalize(value, max);

    return {
      winRate: { raw: winRate, normalized: winRate }, // Already 0-100
      profitFactor: { raw: profitFactor, normalized: normalize(profitFactor, 5) },
      recoveryFactor: { raw: recoveryFactor, normalized: normalize(recoveryFactor, 10) },
      expectancy: { raw: expectancy, normalized: normalize(expectancy, 1) },
      maxDrawdown: { raw: maxDrawdownPercent, normalized: normalizeInverted(maxDrawdownPercent, 50) },
      consistency: { raw: consistency, normalized: consistency }, // Already 0-100
    };
  }, [trades]);

  if (!metrics) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>A visual summary of your key stats.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] flex items-center justify-center text-center text-muted-foreground">
                    Not enough trade data to generate performance metrics.
                </div>
            </CardContent>
        </Card>
    )
  }

  const data = [
    { subject: 'Win Rate', value: metrics.winRate.normalized, raw: `${metrics.winRate.raw.toFixed(1)}%` },
    { subject: 'Consistency', value: metrics.consistency.normalized, raw: `${metrics.consistency.raw.toFixed(1)}%` },
    { subject: 'Max Drawdown', value: metrics.maxDrawdown.normalized, raw: `${metrics.maxDrawdown.raw.toFixed(1)}%` },
    { subject: 'Expectancy (R)', value: metrics.expectancy.normalized, raw: metrics.expectancy.raw.toFixed(2) },
    { subject: 'Recovery Factor', value: metrics.recoveryFactor.normalized, raw: isFinite(metrics.recoveryFactor.raw) ? metrics.recoveryFactor.raw.toFixed(2) : '∞' },
    { subject: 'Profit Factor', value: metrics.profitFactor.normalized, raw: isFinite(metrics.profitFactor.raw) ? metrics.profitFactor.raw.toFixed(2) : '∞' },
  ].map(d => ({ ...d, fullMark: 100 }));


  const tickColor = theme === 'dark' ? '#e2e8f0' : '#334155';
  const strokeColor = 'hsl(var(--success))';
  const fillColor = 'hsl(var(--success))';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>A visual summary of your key stats.</CardDescription>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                <PolarGrid stroke={gridColor}/>
                <PolarAngleAxis dataKey="subject" tick={{ fill: tickColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                      background: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                  }}
                  formatter={(value, name, props) => [props.payload.raw, name]}
                />
                <Radar name="Metrics" dataKey="value" stroke={strokeColor} fill={fillColor} fillOpacity={0.8} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
