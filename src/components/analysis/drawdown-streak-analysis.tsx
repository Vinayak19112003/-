
"use client";

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { cn } from "@/lib/utils";

const StatItem = ({ label, value, valueClassName }: { label: string, value: string, valueClassName?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-semibold", valueClassName)}><StreamerModeText>{value}</StreamerModeText></p>
    </div>
);

export default memo(function DrawdownStreakAnalysis({ trades }: { trades: Trade[] }) {
    const stats = useMemo(() => {
        if (trades.length === 0) {
            return {
                maxDrawdown: '0.00R',
                maxDrawdownDollars: '$0.00',
                longestWinStreak: 0,
                longestLossStreak: 0,
            };
        }

        const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let cumulativeR = 0;
        let peakR = 0;
        let maxDrawdownR = 0;
        
        let cumulativeDollars = 0;
        let peakDollars = 0;
        let maxDrawdownDollars = 0;

        let currentWinStreak = 0;
        let longestWinStreak = 0;
        let currentLossStreak = 0;
        let longestLossStreak = 0;

        sortedTrades.forEach(trade => {
            cumulativeR += (trade.result === 'Win' ? trade.rr || 0 : (trade.result === 'Loss' ? -1 : 0));
            cumulativeDollars += trade.pnl || 0;

            if (cumulativeR > peakR) peakR = cumulativeR;
            if (cumulativeDollars > peakDollars) peakDollars = cumulativeDollars;

            const drawdownR = peakR - cumulativeR;
            if (drawdownR > maxDrawdownR) maxDrawdownR = drawdownR;
            
            const drawdownDollars = peakDollars - cumulativeDollars;
            if (drawdownDollars > maxDrawdownDollars) maxDrawdownDollars = drawdownDollars;

            if (trade.result === 'Win') {
                currentWinStreak++;
                if (currentLossStreak > 0) currentLossStreak = 0;
                if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
            } else if (trade.result === 'Loss') {
                currentLossStreak++;
                if (currentWinStreak > 0) currentWinStreak = 0;
                if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
            } else {
                currentWinStreak = 0;
                currentLossStreak = 0;
            }
        });
        
        return {
            maxDrawdown: `${maxDrawdownR.toFixed(2)}R`,
            maxDrawdownDollars: `$${maxDrawdownDollars.toFixed(2)}`,
            longestWinStreak,
            longestLossStreak,
        };

    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Drawdown & Streak Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <StatItem label="Max Drawdown (R)" value={stats.maxDrawdown} valueClassName="text-destructive" />
                <StatItem label="Max Drawdown ($)" value={stats.maxDrawdownDollars} valueClassName="text-destructive" />
                <StatItem label="Longest Win Streak" value={`${stats.longestWinStreak} trades`} valueClassName="text-success" />
                <StatItem label="Longest Loss Streak" value={`${stats.longestLossStreak} trades`} valueClassName="text-destructive" />
            </CardContent>
        </Card>
    );
});
