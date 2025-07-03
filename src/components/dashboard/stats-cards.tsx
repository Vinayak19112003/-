
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";

type StatsCardsProps = {
  trades: Trade[];
};

export function StatsCards({ trades }: StatsCardsProps) {
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        netR: 0,
        totalPnl: 0,
        wins: 0,
        losses: 0,
        bes: 0,
        avgWin: 0,
        avgLoss: 0,
        largestProfit: 0,
        largestLoss: 0,
      };
    }

    const winTrades = trades.filter((t) => t.result === "Win");
    const lossTrades = trades.filter((t) => t.result === "Loss");
    const wins = winTrades.length;
    const losses = lossTrades.length;
    const bes = trades.filter((t) => t.result === "BE").length;
    const winRate = (wins / (wins + losses)) * 100 || 0;
    
    const netR = trades.reduce((acc, trade) => {
        if (trade.result === 'Win') return acc + (trade.rr || 0);
        if (trade.result === 'Loss') return acc - 1;
        return acc;
    }, 0);

    const totalPnl = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);

    const totalWinningPnl = winTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const totalLosingPnl = lossTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

    const avgWin = wins > 0 ? totalWinningPnl / wins : 0;
    const avgLoss = losses > 0 ? totalLosingPnl / losses : 0;
    
    const largestProfit = trades.reduce((max, trade) => {
        const pnl = trade.pnl || 0;
        return pnl > max ? pnl : max;
    }, 0);

    const largestLoss = trades.reduce((min, trade) => {
        const pnl = trade.pnl || 0;
        return pnl < min ? pnl : min;
    }, 0);


    return {
      totalTrades,
      winRate,
      netR,
      totalPnl,
      wins,
      losses,
      bes,
      avgWin,
      avgLoss,
      largestProfit,
      largestLoss,
    };
  }, [trades]);

  const StatCard = ({ title, value, unit, description, badge, valueClassName, children }: { title: string, value: string | React.ReactNode, unit?: string, description?: string, badge?: React.ReactNode, valueClassName?: string, children?: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {badge}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold font-headline", valueClassName)}>
          {value}
          {unit && <span className="text-sm font-body font-normal text-muted-foreground">{unit}</span>}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Trades" value={stats.totalTrades.toString()} />
      <StatCard title="Win Rate" value={stats.winRate.toFixed(2)} unit="%" description={`${stats.wins} Wins / ${stats.losses} Losses`}/>
      <StatCard 
        title="Net PNL ($)" 
        value={
          <StreamerModeText>
            {`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}`}
          </StreamerModeText>
        }
        description="Total profit across all trades"
        valueClassName={stats.totalPnl > 0 ? 'text-success' : stats.totalPnl < 0 ? 'text-destructive' : ''}
      />
      <StatCard 
        title="Net R" 
        value={`${stats.netR >= 0 ? '+' : ''}${stats.netR.toFixed(2)}`} 
        unit="R" 
        description="Total R value across all trades"
        valueClassName={stats.netR > 0 ? 'text-success' : stats.netR < 0 ? 'text-destructive' : ''}
      />
      <StatCard 
        title="Avg. Win ($)"
        value={
          <StreamerModeText>
            {`+${stats.avgWin.toFixed(2)}`}
          </StreamerModeText>
        }
        valueClassName="text-success"
        description="Average PNL of winning trades"
      />
      <StatCard 
        title="Avg. Loss ($)"
        value={
          <StreamerModeText>
            {`${stats.avgLoss.toFixed(2)}`}
          </StreamerModeText>
        }
        valueClassName="text-destructive"
        description="Average PNL of losing trades"
      />
      <StatCard 
        title="Largest Profit"
        value={
          <StreamerModeText>
            {`$${stats.largestProfit.toFixed(2)}`}
          </StreamerModeText>
        }
        valueClassName="text-success"
        description="Best single trade PNL"
      />
      <StatCard 
        title="Largest Loss"
        value={
          <StreamerModeText>
            {`$${stats.largestLoss.toFixed(2)}`}
          </StreamerModeText>
        }
        valueClassName="text-destructive"
        description="Worst single trade PNL"
      />
    </div>
  );
}
