
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { useTargets } from "@/hooks/use-targets";
import { Progress } from "@/components/ui/progress";

type StatsCardsProps = {
  trades: Trade[];
};

export function StatsCards({ trades }: StatsCardsProps) {
  const { targets } = useTargets();

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
        totalLosingPnl: 0,
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
      totalLosingPnl,
    };
  }, [trades]);

  const profitProgress = targets.profit > 0 && stats.totalPnl > 0 ? (stats.totalPnl / targets.profit) * 100 : 0;
  const lossProgress = targets.loss > 0 && stats.totalLosingPnl < 0 ? (Math.abs(stats.totalLosingPnl) / targets.loss) * 100 : 0;


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
        title="Profit Target"
        value={
            <StreamerModeText>
                {`$${targets.profit.toLocaleString()}`}
            </StreamerModeText>
        }
        description={
            targets.profit > 0 ? `You've made ${profitProgress.toFixed(0)}% of your target.` : "No target set."
        }
      >
        {targets.profit > 0 && stats.totalPnl > 0 && <Progress value={profitProgress} className="h-2 mt-2" indicatorClassName="bg-success" />}
      </StatCard>
      <StatCard
        title="Loss Limit"
        value={
            <StreamerModeText>
                {`$${targets.loss.toLocaleString()}`}
            </StreamerModeText>
        }
        description={
             targets.loss > 0 ? `You are at ${lossProgress.toFixed(0)}% of your loss limit.` : "No limit set."
        }
      >
        {targets.loss > 0 && stats.totalLosingPnl < 0 && <Progress value={lossProgress} className="h-2 mt-2" indicatorClassName="bg-destructive" />}
      </StatCard>
    </div>
  );
}
