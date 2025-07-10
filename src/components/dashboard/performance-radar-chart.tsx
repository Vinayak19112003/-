
"use client";

import { useMemo, useState, useEffect, memo } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Trade } from '@/lib/types';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';

type PerformanceRadarChartProps = {
  trades: Trade[];
  tradingRules: string[];
};

export default memo(function PerformanceRadarChart({ trades, tradingRules }: PerformanceRadarChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    if (totalTrades < 3) {
      return null;
    }

    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let winCount = 0;
    let lossCount = 0;
    let grossProfitR = 0;
    let totalAdherenceScore = 0;
    const totalRules = tradingRules.length;

    let cumulativeR = 0;
    let peakR = 0;
    let maxDrawdownR = 0;

    for (const trade of sortedTrades) {
        let rValue = 0;
        if (trade.result === 'Win') {
            winCount++;
            rValue = trade.rr || 0;
            grossProfitR += rValue;
        } else if (trade.result === 'Loss') {
            lossCount++;
            rValue = -1;
        }

        if (totalRules > 0 && trade.rulesFollowed) {
            totalAdherenceScore += (trade.rulesFollowed.length / totalRules) * 100;
        } else if (totalRules === 0) {
            totalAdherenceScore += 100;
        }
        
        cumulativeR += rValue;
        if (cumulativeR > peakR) {
            peakR = cumulativeR;
        }
        const drawdown = peakR - cumulativeR;
        if (drawdown > maxDrawdownR) {
            maxDrawdownR = drawdown;
        }
    }

    const winRate = winCount + lossCount > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;
    const grossLossR = lossCount;
    const netProfitR = grossProfitR - grossLossR;
    const profitFactor = grossLossR > 0 ? grossProfitR / grossLossR : grossProfitR > 0 ? Infinity : 0;
    
    const avgWinR = winCount > 0 ? grossProfitR / winCount : 0;
    const expectancy = (winRate / 100) * avgWinR - ((100 - winRate) / 100) * 1;
    
    const recoveryFactor = maxDrawdownR > 0 ? netProfitR / maxDrawdownR : netProfitR > 0 ? Infinity : 0;
    const maxDrawdownPercent = peakR > 0 ? (maxDrawdownR / peakR) * 100 : 0;
    const discipline = totalTrades > 0 ? totalAdherenceScore / totalTrades : 0;

    const normalize = (value: number, max: number) => Math.min(Math.max((value / max) * 100, 0), 100);
    const normalizeInverted = (value: number, max: number) => 100 - normalize(value, max);

    return {
      winRate: { raw: winRate, normalized: winRate },
      profitFactor: { raw: profitFactor, normalized: normalize(profitFactor, 5) },
      recoveryFactor: { raw: recoveryFactor, normalized: normalize(recoveryFactor, 10) },
      expectancy: { raw: expectancy, normalized: normalize(expectancy, 1) },
      discipline: { raw: discipline, normalized: discipline },
      maxDrawdown: { raw: maxDrawdownPercent, normalized: normalizeInverted(maxDrawdownPercent, 50) },
    };
  }, [trades, tradingRules]);

  if (!mounted) {
    return <Skeleton className="h-[300px] w-full" />;
  }
  
  if (!metrics) {
    return (
        <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
            Not enough trade data to generate performance metrics.
        </div>
    )
  }

  const data = [
    { subject: 'Win Rate', value: metrics.winRate.normalized, raw: `${metrics.winRate.raw.toFixed(1)}%` },
    { subject: 'Discipline', value: metrics.discipline.normalized, raw: `${metrics.discipline.raw.toFixed(1)}%` },
    { subject: 'Max Drawdown', value: metrics.maxDrawdown.normalized, raw: `${metrics.maxDrawdown.raw.toFixed(1)}%` },
    { subject: 'Expectancy', value: metrics.expectancy.normalized, raw: metrics.expectancy.raw.toFixed(2) },
    { subject: 'Recovery', value: metrics.recoveryFactor.normalized, raw: isFinite(metrics.recoveryFactor.raw) ? metrics.recoveryFactor.raw.toFixed(2) : '∞' },
    { subject: 'Profit Factor', value: metrics.profitFactor.normalized, raw: isFinite(metrics.profitFactor.raw) ? metrics.profitFactor.raw.toFixed(2) : '∞' },
  ].map(d => ({ ...d, fullMark: 100 }));


  const tickColor = theme === 'dark' ? '#e2e8f0' : '#334155';
  const strokeColor = 'hsl(var(--success))';
  const fillColor = 'hsl(var(--success))';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <defs>
              <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={fillColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={fillColor} stopOpacity={0.1} />
              </radialGradient>
          </defs>
          <PolarGrid stroke={gridColor}/>
          <PolarAngleAxis dataKey="subject" tick={{ fill: tickColor, fontSize: 12, fontWeight: 500 }} />
          <Tooltip
            contentStyle={{
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                boxShadow: '0 4px 12px hsla(var(--foreground) / 0.1)',
            }}
            formatter={(value, name, props) => [props.payload.raw, name]}
          />
          <Radar 
              name="Metrics" 
              dataKey="value" 
              stroke={strokeColor} 
              strokeWidth={2}
              fill="url(#radar-gradient)"
              dot={{ r: 3, strokeWidth: 1.5, stroke: 'hsl(var(--background))', fill: strokeColor }}
          />
        </RadarChart>
      </ResponsiveContainer>
  );
});

    