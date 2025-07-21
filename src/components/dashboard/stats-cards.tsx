
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { useMemo, memo } from "react";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { Badge } from "../ui/badge";

type StatsCardsProps = {
  trades: Trade[];
};

const StatProgressCircle = ({ value, colorClass }: { value: number; colorClass: string }) => {
    const circumference = 2 * Math.PI * 18; // 2 * pi * r
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
        <div className="relative h-12 w-12">
            <svg className="h-full w-full" viewBox="0 0 40 40">
                <circle
                    className="stroke-muted"
                    cx="20"
                    cy="20"
                    r="18"
                    strokeWidth="3"
                    fill="transparent"
                />
                <circle
                    className={cn("transition-all duration-500", colorClass)}
                    cx="20"
                    cy="20"
                    r="18"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                {value.toFixed(0)}%
            </span>
        </div>
    );
};

export const StatsCards = memo(function StatsCards({ trades }: StatsCardsProps) {
  const stats = useMemo(() => {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        winRate: 0,
        totalPnl: 0,
        wins: 0,
        losses: 0,
        bes: 0,
        avgWin: 0,
        avgLoss: 0,
        returnPercentage: 0,
      };
    }

    const winTrades = trades.filter((t) => t.result === "Win");
    const lossTrades = trades.filter((t) => t.result === "Loss");
    const beTrades = trades.filter((t) => t.result === "BE");

    const wins = winTrades.length;
    const losses = lossTrades.length;
    const bes = beTrades.length;
    
    const winRate = (wins / (wins + losses)) * 100 || 0;
    
    const totalPnl = trades.reduce((acc, trade) => acc + (trade.pnl || 0), 0);

    const totalWinningPnl = winTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const totalLosingPnl = lossTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);

    const avgWin = wins > 0 ? totalWinningPnl / wins : 0;
    const avgLoss = losses > 0 ? totalLosingPnl / losses : 0;
    
    const accountSize = trades[0]?.accountSize;
    const returnPercentage = accountSize && accountSize > 0 ? (totalPnl / accountSize) * 100 : 0;

    return {
      winRate,
      totalPnl,
      wins,
      losses,
      bes,
      avgWin,
      avgLoss,
      returnPercentage,
    };
  }, [trades]);

  const StatItem = ({ label, value, valueClassName, progressCircle }: { label: string, value: string | React.ReactNode, valueClassName?: string, progressCircle?: React.ReactNode }) => (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3 h-16">
        <div className="flex items-center gap-4">
            {progressCircle}
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={cn("text-xl font-bold font-headline", valueClassName)}>
                    {value}
                </p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4">
                <StatItem label="Wins" value={stats.wins} valueClassName="text-success" progressCircle={<StatProgressCircle value={stats.winRate} colorClass="stroke-success"/>} />
                <StatItem label="Losses" value={stats.losses} valueClassName="text-destructive" progressCircle={<StatProgressCircle value={stats.winRate > 0 ? 100-stats.winRate : 0} colorClass="stroke-destructive"/>} />
            </div>
            <div className="space-y-4">
                <StatItem label="Avg Win" value={<StreamerModeText>${stats.avgWin.toFixed(2)}</StreamerModeText>} valueClassName="text-success" />
                <StatItem label="Avg Loss" value={<StreamerModeText>${stats.avgLoss.toFixed(2)}</StreamerModeText>} valueClassName="text-destructive" />
            </div>
            <div className="space-y-4">
                <StatItem label="Open" value="0" />
                <StatItem label="Wash" value={stats.bes} />
            </div>
        </div>
        <div className="lg:col-span-3">
             <Card className="h-full flex flex-col justify-center items-center">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base text-muted-foreground font-medium text-center">
                        Total PnL
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <StreamerModeText className={cn(
                        "text-3xl font-bold font-headline",
                        stats.totalPnl > 0 ? "text-success" : stats.totalPnl < 0 ? "text-destructive" : ""
                    )}>
                        {stats.totalPnl >= 0 ? '+$' : '-$'}{Math.abs(stats.totalPnl).toFixed(2)}
                    </StreamerModeText>
                    {stats.returnPercentage !== 0 && (
                         <Badge variant={stats.returnPercentage > 0 ? "success" : "destructive"} className="mt-2">
                            <StreamerModeText>
                                {stats.returnPercentage.toFixed(2)}%
                            </StreamerModeText>
                         </Badge>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
});

