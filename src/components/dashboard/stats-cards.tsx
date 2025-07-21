
"use client";

import { useMemo, memo } from "react";
import type { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { isThisMonth, isThisWeek, getDay, parse, differenceInDays } from 'date-fns';
import { 
    DollarSign, 
    CalendarDays, 
    BarChart3, 
    Hash, 
    Target,
    TrendingUp, 
    Divide,
    Clock,
} from "lucide-react";

type StatCardProps = { 
  label: string; 
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  valueClassName?: string;
};

const StatCard = ({ label, value, subValue, icon: Icon, valueClassName }: StatCardProps) => (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-4 shadow-sm border">
        <div className="flex justify-between items-center text-muted-foreground">
            <p className="text-sm">{label}</p>
            <Icon className="h-4 w-4" />
        </div>
        <div>
            <p className={cn("text-2xl font-bold font-headline", valueClassName)}>
                <StreamerModeText>{value}</StreamerModeText>
            </p>
            {subValue && <p className="text-xs text-muted-foreground"><StreamerModeText>{subValue}</StreamerModeText></p>}
        </div>
    </div>
);

export const StatsCards = memo(function StatsCards({ trades }: { trades: Trade[] }) {
  const stats = useMemo(() => {
    const totalTrades = trades.length;

    const winTrades = trades.filter((t) => t.result === "Win");
    const lossTrades = trades.filter((t) => t.result === "Loss");

    const wins = winTrades.length;
    const losses = lossTrades.length;
    
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    
    const totalPnl = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);
    
    const tradeDates = trades.map(t => t.date.toISOString().split('T')[0]);
    const uniqueTradeDays = new Set(tradeDates).size;
    const avgDailyPnl = uniqueTradeDays > 0 ? totalPnl / uniqueTradeDays : 0;

    const totalR = trades.reduce((acc, trade) => {
        if (trade.result === 'Win') return acc + (trade.rr || 0);
        if (trade.result === 'Loss') return acc - 1;
        return acc;
    }, 0);
    
    const grossProfit = winTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const grossLoss = Math.abs(lossTrades.reduce((acc, t) => acc + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
    
    let totalDuration = 0;
    let durationCount = 0;
    trades.forEach(trade => {
        if (trade.entryTime && trade.exitTime) {
            try {
                const entry = parse(`${trade.date.toISOString().split('T')[0]} ${trade.entryTime}`, 'yyyy-MM-dd HH:mm', new Date());
                const exit = parse(`${trade.date.toISOString().split('T')[0]} ${trade.exitTime}`, 'yyyy-MM-dd HH:mm', new Date());
                if (!isNaN(entry.getTime()) && !isNaN(exit.getTime())) {
                    if (exit < entry) exit.setDate(exit.getDate() + 1); // Handle overnight
                    totalDuration += (exit.getTime() - entry.getTime()) / (1000 * 60); // in minutes
                    durationCount++;
                }
            } catch(e) { /* ignore parse errors */ }
        }
    });
    const avgDurationMinutes = durationCount > 0 ? totalDuration / durationCount : 0;

    return {
      totalPnl,
      avgDailyPnl,
      totalTrades,
      winRate: `${winRate.toFixed(1)}%`,
      totalR: totalR.toFixed(2) + 'R',
      profitFactor: isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞",
      totalWins: wins,
      totalLosses: losses,
      avgTradeDuration: `${avgDurationMinutes.toFixed(0)} min`
    };
  }, [trades]);
  
  const formatCurrency = (value: number) => {
      const sign = value >= 0 ? "+" : "-";
      return `${sign}$${Math.abs(value).toFixed(2)}`;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            label="Total P&L" 
            value={formatCurrency(stats.totalPnl)}
            subValue="Net profit/loss for period"
            icon={DollarSign}
            valueClassName={stats.totalPnl >= 0 ? "text-success" : "text-destructive"}
        />
         <StatCard 
            label="Avg Daily P&L" 
            value={formatCurrency(stats.avgDailyPnl)}
            subValue="Avg profit/loss per day"
            icon={CalendarDays}
            valueClassName={stats.avgDailyPnl >= 0 ? "text-success" : "text-destructive"}
        />
        <StatCard 
            label="Win / Loss" 
            value={`${stats.totalWins} / ${stats.totalLosses}`}
            subValue="Total winning & losing trades"
            icon={BarChart3}
        />
        <StatCard 
            label="Total Trades" 
            value={stats.totalTrades}
            subValue="Total trades in period"
            icon={Hash}
        />
        <StatCard 
            label="Win Rate" 
            value={stats.winRate}
            subValue="Winning trades percentage"
            icon={Target}
            valueClassName={parseFloat(stats.winRate) >= 50 ? "text-success" : "text-destructive"}
        />
        <StatCard 
            label="Net R" 
            value={stats.totalR}
            subValue="Net R-multiple for period"
            icon={TrendingUp}
            valueClassName={parseFloat(stats.totalR) >= 0 ? "text-success" : "text-destructive"}
        />
        <StatCard 
            label="Profit Factor" 
            value={stats.profitFactor}
            subValue="Gross profit / Gross loss"
            icon={Divide}
            valueClassName={parseFloat(stats.profitFactor) >= 1 ? "text-success" : "text-destructive"}
        />
         <StatCard 
            label="Avg Trade Duration" 
            value={stats.avgTradeDuration}
            subValue="Average holding time"
            icon={Clock}
        />
    </div>
  );
});
