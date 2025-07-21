
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

export default memo(function SystemQualityMetrics({ trades }: { trades: Trade[] }) {
    const stats = useMemo(() => {
        const totalTrades = trades.length;
        if (totalTrades < 2) {
            return {
                sharpeRatio: 'N/A',
                sqn: 'N/A',
                consistencyScore: 'N/A',
                totalTrades: totalTrades.toString(),
            };
        }

        const rValues = trades.map(t => (t.result === 'Win' ? t.rr || 0 : (t.result === 'Loss' ? -1 : 0)));
        const avgReturn = rValues.reduce((a, b) => a + b, 0) / totalTrades;
        const stdDev = Math.sqrt(rValues.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / totalTrades);

        // Assuming risk-free rate is 0 for simplicity
        const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
        
        const expectancy = avgReturn; // Same as avgReturn in R terms
        const sqn = stdDev > 0 ? (expectancy / stdDev) * Math.sqrt(totalTrades) : 0;

        const pnlValues = trades.map(t => t.pnl || 0);
        const avgPnl = pnlValues.reduce((a, b) => a + b, 0) / totalTrades;
        const pnlStdDev = Math.sqrt(pnlValues.map(x => Math.pow(x - avgPnl, 2)).reduce((a, b) => a + b, 0) / totalTrades);
        const consistencyScore = (avgPnl / pnlStdDev) * 100;

        return {
            sharpeRatio: isNaN(sharpeRatio) ? 'N/A' : sharpeRatio.toFixed(2),
            sqn: isNaN(sqn) ? 'N/A' : sqn.toFixed(2),
            consistencyScore: isNaN(consistencyScore) ? 'N/A' : `${consistencyScore.toFixed(0)}%`,
            totalTrades: totalTrades.toString(),
        };

    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <StatItem label="Sharpe Ratio" value={stats.sharpeRatio} />
                <StatItem label="System Quality Number (SQN)" value={stats.sqn} />
                <StatItem label="Consistency Score" value={stats.consistencyScore} />
                <StatItem label="Total Trades" value={stats.totalTrades} />
            </CardContent>
        </Card>
    );
});
