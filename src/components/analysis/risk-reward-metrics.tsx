
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

export default memo(function RiskRewardMetrics({ trades }: { trades: Trade[] }) {
    const stats = useMemo(() => {
        if (trades.length === 0) {
            return {
                avgWinR: '0.00R',
                avgLossR: '0.00R',
                riskRewardRatio: '0.00',
                expectancy: '0.00R',
            };
        }

        const winningTrades = trades.filter(t => t.result === 'Win');
        const losingTrades = trades.filter(t => t.result === 'Loss');
        
        const avgWinR = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.rr || 0), 0) / winningTrades.length : 0;
        const avgLossR = losingTrades.length > 0 ? -1 : 0; // Each loss is -1R

        const riskRewardRatio = avgLossR !== 0 ? Math.abs(avgWinR / avgLossR) : 0;

        const winRate = (winningTrades.length + losingTrades.length) > 0 ? winningTrades.length / (winningTrades.length + losingTrades.length) : 0;
        const lossRate = 1 - winRate;
        const expectancy = (winRate * avgWinR) - (lossRate * Math.abs(avgLossR));
        
        return {
            avgWinR: `${avgWinR.toFixed(2)}R`,
            avgLossR: `${avgLossR.toFixed(2)}R`,
            riskRewardRatio: riskRewardRatio.toFixed(2),
            expectancy: `${expectancy.toFixed(2)}R`,
        };

    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Risk & Reward Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <StatItem label="Avg Win (R)" value={stats.avgWinR} valueClassName="text-success" />
                <StatItem label="Avg Loss (R)" value={stats.avgLossR} valueClassName="text-destructive" />
                <StatItem label="Risk/Reward Ratio" value={stats.riskRewardRatio} />
                <StatItem label="Expectancy" value={stats.expectancy} valueClassName={stats.expectancy.startsWith('-') ? "text-destructive" : "text-success"}/>
            </CardContent>
        </Card>
    );
});
