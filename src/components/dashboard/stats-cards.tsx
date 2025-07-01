
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
      };
    }

    const wins = trades.filter((t) => t.result === "Win").length;
    const losses = trades.filter((t) => t.result === "Loss").length;
    const bes = trades.filter((t) => t.result === "BE").length;
    const winRate = (wins / (wins + losses)) * 100 || 0;
    
    const netR = trades.reduce((acc, trade) => {
        if (trade.result === 'Win') return acc + (trade.rr || 0);
        if (trade.result === 'Loss') return acc - 1;
        return acc;
    }, 0);

    const totalPnl = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);


    return {
      totalTrades,
      winRate,
      netR,
      totalPnl,
      wins,
      losses,
      bes,
    };
  }, [trades]);

  const StatCard = ({ title, value, unit, description, badge, valueClassName }: { title: string, value: string, unit?: string, description?: string, badge?: React.ReactNode, valueClassName?: string }) => (
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
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Trades" value={stats.totalTrades.toString()} />
      <StatCard title="Win Rate" value={stats.winRate.toFixed(2)} unit="%" description={`${stats.wins} Wins / ${stats.losses} Losses`}/>
      <StatCard 
        title="Net PNL ($)" 
        value={`${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}`}
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
    </div>
  );
}
