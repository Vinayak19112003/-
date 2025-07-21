
"use client";

import { useMemo, memo } from "react";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { isThisMonth, isThisWeek, startOfWeek } from 'date-fns';
import { Card } from "../ui/card";

type StatsCardsProps = {
  trades: Trade[];
};

const StatCard = ({ label, value, valueClassName, subValue, subValueClassName }: { label: string, value: string | number, valueClassName?: string, subValue?: string, subValueClassName?: string }) => (
    <Card className="flex items-center justify-between p-4 h-20">
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold font-headline", valueClassName)}>
                <StreamerModeText>{value}</StreamerModeText>
            </p>
        </div>
        {subValue && (
             <p className={cn("text-lg font-semibold font-headline", subValueClassName)}>
                <StreamerModeText>{subValue}</StreamerModeText>
            </p>
        )}
    </Card>
);

export const StatsCards = memo(function StatsCards({ trades }: StatsCardsProps) {
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalPnl: "$0.00",
        totalPnlValue: 0,
        weeklyPnl: "$0.00",
        weeklyPnlValue: 0,
        monthlyPnl: "$0.00",
        monthlyPnlValue: 0,
        totalTrades: 0,
        winRate: "0%",
        totalR: "0.00R",
        profitFactor: "0.00",
        profitFactorValue: 0,
      };
    }

    const winTrades = trades.filter((t) => t.result === "Win");
    const lossTrades = trades.filter((t) => t.result === "Loss");

    const wins = winTrades.length;
    const losses = lossTrades.length;
    
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    
    // P&L Calculations
    const totalPnl = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
    const weeklyTrades = trades.filter(t => isThisWeek(new Date(t.date), { weekStartsOn: 1 }));
    const weeklyPnl = weeklyTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const monthlyTrades = trades.filter(t => isThisMonth(new Date(t.date)));
    const monthlyPnl = monthlyTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

    // R-Value and Profit Factor
    const totalR = trades.reduce((acc, trade) => {
        if (trade.result === 'Win') return acc + (trade.rr || 0);
        if (trade.result === 'Loss') return acc - 1;
        return acc;
    }, 0);
    
    const grossProfit = trades.filter(t => t.pnl && t.pnl > 0).reduce((acc, t) => acc + (t.pnl || 0), 0);
    const grossLoss = Math.abs(trades.filter(t => t.pnl && t.pnl < 0).reduce((acc, t) => acc + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    return {
      totalPnl: `${totalPnl >= 0 ? '+$' : '-$'}${Math.abs(totalPnl).toFixed(2)}`,
      totalPnlValue: totalPnl,
      weeklyPnl: `${weeklyPnl >= 0 ? '+$' : '-$'}${Math.abs(weeklyPnl).toFixed(2)}`,
      weeklyPnlValue: weeklyPnl,
      monthlyPnl: `${monthlyPnl >= 0 ? '+$' : '-$'}${Math.abs(monthlyPnl).toFixed(2)}`,
      monthlyPnlValue: monthlyPnl,
      totalTrades,
      winRate: `${winRate.toFixed(1)}%`,
      totalR: `${totalR.toFixed(2)}R`,
      profitFactor: isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞",
      profitFactorValue: profitFactor,
    };
  }, [trades]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
            label="Total P&L" 
            value={stats.totalPnl} 
            valueClassName={stats.totalPnlValue >= 0 ? "text-success" : "text-destructive"}
        />
        <StatCard 
            label="Weekly P&L" 
            value={stats.weeklyPnl} 
            valueClassName={stats.weeklyPnlValue >= 0 ? "text-success" : "text-destructive"}
        />
        <StatCard 
            label="Monthly P&L" 
            value={stats.monthlyPnl} 
            valueClassName={stats.monthlyPnlValue >= 0 ? "text-success" : "text-destructive"}
        />
        <StatCard label="Total Trades" value={stats.totalTrades} />
        <StatCard label="Win Rate" value={stats.winRate} />
        <StatCard 
            label="Total R" 
            value={stats.totalR} 
            valueClassName={parseFloat(stats.totalR) >= 0 ? "text-success" : "text-destructive"}
        />
        <StatCard 
            label="Profit Factor" 
            value={stats.profitFactor} 
            valueClassName={stats.profitFactorValue >= 1 ? "text-success" : "text-destructive"}
        />
    </div>
  );
});

