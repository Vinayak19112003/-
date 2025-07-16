
"use client";

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";

type RiskAdjustedReturnsProps = {
  trades: Trade[];
};

const StatCard = ({ title, value, description, valueClassName }: { title: string, value: string, description?: string, valueClassName?: string }) => (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <StreamerModeText as="p" className={cn("text-2xl font-bold font-headline", valueClassName)}>
            {value}
        </StreamerModeText>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
);


export const RiskAdjustedReturns = memo(function RiskAdjustedReturns({ trades }: RiskAdjustedReturnsProps) {
    const stats = useMemo(() => {
        const totalTrades = trades.length;
        if (totalTrades < 2) {
            return {
                profitFactor: 0,
                expectancy: 0,
                recoveryFactor: 0,
                avgRr: 0
            };
        }

        let winCount = 0;
        let lossCount = 0;
        let grossProfitR = 0;
        let cumulativeR = 0;
        let peakR = 0;
        let maxDrawdownR = 0;

        for (const trade of trades) {
            let rValue = 0;
            if (trade.result === 'Win') {
                winCount++;
                rValue = trade.rr || 0;
                grossProfitR += rValue;
            } else if (trade.result === 'Loss') {
                lossCount++;
                rValue = -1;
            }

            cumulativeR += rValue;
            if (cumulativeR > peakR) {
                peakR = cumulativeR;
            }
            const drawdown = peakR - cumulativeR;
            if (drawdown > maxDrawdownR) {
                maxDrawdownR = drawdown;
            }
        }

        const grossLossR = lossCount;
        const netProfitR = grossProfitR - grossLossR;

        const profitFactor = grossLossR > 0 ? grossProfitR / grossLossR : (grossProfitR > 0 ? Infinity : 0);
        const winRate = (winCount + lossCount) > 0 ? (winCount / (winCount + lossCount)) : 0;
        const avgWinR = winCount > 0 ? grossProfitR / winCount : 0;
        const avgLossR = 1; // Always -1R
        const expectancy = (winRate * avgWinR) - ((1 - winRate) * avgLossR);
        const recoveryFactor = maxDrawdownR > 0 ? netProfitR / maxDrawdownR : (netProfitR > 0 ? Infinity : 0);
        const avgRr = winCount > 0 ? grossProfitR / winCount : 0;

        return {
            profitFactor,
            expectancy,
            recoveryFactor,
            avgRr
        };
    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Risk-Adjusted Returns</CardTitle>
                <CardDescription>Key metrics that measure the quality and consistency of your returns.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Profit Factor" 
                        value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}
                        description="Gross profit divided by gross loss"
                        valueClassName={stats.profitFactor >= 1 ? "text-success" : "text-destructive"}
                    />
                    <StatCard 
                        title="Expectancy (R)"
                        value={stats.expectancy.toFixed(2) + 'R'}
                        description="Average R-value per trade"
                        valueClassName={stats.expectancy > 0 ? "text-success" : "text-destructive"}
                    />
                    <StatCard 
                        title="Recovery Factor" 
                        value={isFinite(stats.recoveryFactor) ? stats.recoveryFactor.toFixed(2) : '∞'}
                        description="Net profit divided by max drawdown"
                        valueClassName={stats.recoveryFactor > 1 ? "text-success" : "text-destructive"}
                    />
                    <StatCard 
                        title="Average R-Multiple (Win)"
                        value={stats.avgRr.toFixed(2) + 'R'}
                        description="Average R of winning trades"
                        valueClassName="text-success"
                    />
                </div>
            </CardContent>
        </Card>
    );
});
