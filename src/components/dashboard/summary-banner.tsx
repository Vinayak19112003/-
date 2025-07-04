
"use client";

import { useMemo } from 'react';
import { type Trade } from '@/lib/types';
import { isToday } from 'date-fns';
import { TrendingUp, TrendingDown, Target, HelpCircle } from 'lucide-react';
import { StreamerModeText } from '@/components/streamer-mode-text';

type SummaryBannerProps = {
  trades: Trade[];
};

export function SummaryBanner({ trades }: SummaryBannerProps) {
  const todayStats = useMemo(() => {
    const todaysTrades = trades.filter(trade => isToday(new Date(trade.date)));
    if (todaysTrades.length === 0) {
      return null;
    }

    const wins = todaysTrades.filter(t => t.result === 'Win').length;
    const losses = todaysTrades.filter(t => t.result === 'Loss').length;
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    const netPnl = todaysTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

    const mistakeCounts: { [key: string]: number } = {};
    todaysTrades.forEach(trade => {
      trade.mistakes?.forEach(mistake => {
        mistakeCounts[mistake] = (mistakeCounts[mistake] || 0) + 1;
      });
    });
    
    const topMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { winRate, netPnl, topMistake };
  }, [trades]);

  if (!todayStats) {
    return (
        <div className="flex items-center justify-center gap-2 rounded-lg border bg-card text-card-foreground p-3 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            <span>No trades logged today. Start logging to see your daily summary here.</span>
        </div>
    );
  }

  const pnlIcon = todayStats.netPnl >= 0 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />;
  const pnlColor = todayStats.netPnl >= 0 ? 'text-success' : 'text-destructive';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg border bg-card text-card-foreground p-3 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Today's Win Rate</p>
                <p className="text-lg font-bold font-headline">{todayStats.winRate.toFixed(1)}%</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${todayStats.netPnl >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {pnlIcon}
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Today's Net PNL</p>
                <StreamerModeText as="p" className={`text-lg font-bold font-headline ${pnlColor}`}>
                    {todayStats.netPnl >= 0 ? '+' : ''}$${todayStats.netPnl.toFixed(2)}
                </StreamerModeText>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Today's Top Mistake</p>
                <p className="text-base font-semibold truncate">{todayStats.topMistake || 'None'}</p>
            </div>
        </div>
    </div>
  );
}
