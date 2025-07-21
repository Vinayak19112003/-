
"use client";

import { useMemo, memo } from "react";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";

type StatsCardsProps = {
  trades: Trade[];
};

const StatCard = ({ label, value, valueClassName }: { label: string, value: string | number, valueClassName?: string }) => (
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4 text-center h-24">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold font-headline", valueClassName)}>
            <StreamerModeText>{value}</StreamerModeText>
        </p>
    </div>
);

export const StatsCards = memo(function StatsCards({ trades }: StatsCardsProps) {
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winRate: "0%",
        netPnl: "$0.00",
        netR: "0.00R",
        avgWin: "$0.00",
        avgLoss: "$0.00",
        largestProfit: "$0.00",
        largestLoss: "$0.00",
      };
    }

    const winTrades = trades.filter((t) => t.result === "Win");
    const lossTrades = trades.filter((t) => t.result === "Loss");

    const wins = winTrades.length;
    const losses = lossTrades.length;
    
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    
    const netPnl = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);

    const netR = trades.reduce((acc, trade) => {
        if (trade.result === 'Win') return acc + (trade.rr || 0);
        if (trade.result === 'Loss') return acc - 1;
        return acc;
    }, 0);

    const totalWinningPnl = winTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const totalLosingPnl = lossTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

    const avgWin = wins > 0 ? totalWinningPnl / wins : 0;
    const avgLoss = losses > 0 ? totalLosingPnl / losses : 0;

    const largestProfit = Math.max(0, ...trades.map(t => t.pnl || 0));
    const largestLoss = Math.min(0, ...trades.map(t => t.pnl || 0));
    

    return {
      totalTrades,
      winRate: `${winRate.toFixed(1)}%`,
      netPnl: `${netPnl >= 0 ? '+$' : '-$'}${Math.abs(netPnl).toFixed(2)}`,
      netR: `${netR.toFixed(2)}R`,
      avgWin: `+$${avgWin.toFixed(2)}`,
      avgLoss: `-$${Math.abs(avgLoss).toFixed(2)}`,
      largestProfit: `+$${largestProfit.toFixed(2)}`,
      largestLoss: `-$${Math.abs(largestLoss).toFixed(2)}`,
      netPnlValue: netPnl,
      netRValue: netR,
    };
  }, [trades]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard label="Total Trades" value={stats.totalTrades} />
        <StatCard label="Win Rate" value={stats.winRate} />
        <StatCard label="Net PNL ($)" value={stats.netPnl} valueClassName={stats.netPnlValue > 0 ? "text-success" : stats.netPnlValue < 0 ? "text-destructive" : ""}/>
        <StatCard label="Net R" value={stats.netR} valueClassName={stats.netRValue > 0 ? "text-success" : stats.netRValue < 0 ? "text-destructive" : ""}/>
        <StatCard label="Avg. Win ($)" value={stats.avgWin} valueClassName="text-success" />
        <StatCard label="Avg. Loss ($)" value={stats.avgLoss} valueClassName="text-destructive" />
        <StatCard label="Largest Profit" value={stats.largestProfit} valueClassName="text-success" />
        <StatCard label="Largest Loss" value={stats.largestLoss} valueClassName="text-destructive" />
    </div>
  );
});