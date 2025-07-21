
"use client";

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Trade } from "@/lib/types";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { cn } from "@/lib/utils";
import { differenceInDays, getDay, parse, subDays } from 'date-fns';

const StatItem = ({ label, value, valueClassName }: { label: string, value: string, valueClassName?: string }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-semibold", valueClassName)}><StreamerModeText>{value}</StreamerModeText></p>
    </div>
);

export default memo(function CoreMetrics({ trades }: { trades: Trade[] }) {
    const stats = useMemo(() => {
        if (trades.length === 0) {
            return {
                largestProfit: '$0.00',
                largestLoss: '$0.00',
                avgWin: '$0.00',
                avgLoss: '$0.00',
                mostProfitableDay: 'N/A',
                leastProfitableDay: 'N/A',
                avgTradesPerDay: '0.0',
                avgTradeDuration: 'N/A',
            };
        }

        const winningTrades = trades.filter(t => t.pnl != null && t.pnl > 0);
        const losingTrades = trades.filter(t => t.pnl != null && t.pnl < 0);

        const largestProfit = Math.max(0, ...winningTrades.map(t => t.pnl!));
        const largestLoss = Math.min(0, ...losingTrades.map(t => t.pnl!));

        const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl!, 0) / losingTrades.length : 0;
        
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const pnlByDay: { [day: string]: number } = {};
        daysOfWeek.forEach(day => pnlByDay[day] = 0);
        trades.forEach(t => {
            const day = daysOfWeek[getDay(t.date)];
            pnlByDay[day] += t.pnl || 0;
        });

        const sortedDays = Object.entries(pnlByDay).sort((a, b) => b[1] - a[1]);
        const mostProfitableDay = sortedDays[0][1] > 0 ? sortedDays[0][0] : 'N/A';
        const leastProfitableDay = sortedDays[6][1] < 0 ? sortedDays[6][0] : 'N/A';
        
        const tradeDates = trades.map(t => t.date.toISOString().split('T')[0]);
        const uniqueTradeDays = new Set(tradeDates).size;
        const avgTradesPerDay = uniqueTradeDays > 0 ? trades.length / uniqueTradeDays : 0;

        let totalDuration = 0;
        let durationCount = 0;
        trades.forEach(trade => {
            if (trade.entryTime && trade.exitTime) {
                const entry = parse(`${trade.date.toISOString().split('T')[0]} ${trade.entryTime}`, 'yyyy-MM-dd HH:mm', new Date());
                const exit = parse(`${trade.date.toISOString().split('T')[0]} ${trade.exitTime}`, 'yyyy-MM-dd HH:mm', new Date());
                if (!isNaN(entry.getTime()) && !isNaN(exit.getTime())) {
                    if (exit < entry) exit.setDate(exit.getDate() + 1); // Handle overnight
                    totalDuration += (exit.getTime() - entry.getTime()) / (1000 * 60); // in minutes
                    durationCount++;
                }
            }
        });
        const avgDurationMinutes = durationCount > 0 ? totalDuration / durationCount : 0;
        const avgTradeDuration = avgDurationMinutes > 0 ? `${Math.round(avgDurationMinutes)} min` : 'N/A';
        
        return {
            largestProfit: `$${largestProfit.toFixed(2)}`,
            largestLoss: `$${largestLoss.toFixed(2)}`,
            avgWin: `$${avgWin.toFixed(2)}`,
            avgLoss: `$${avgLoss.toFixed(2)}`,
            mostProfitableDay,
            leastProfitableDay,
            avgTradesPerDay: avgTradesPerDay.toFixed(1),
            avgTradeDuration,
        };

    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Core Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <StatItem label="Largest Profit" value={stats.largestProfit} valueClassName="text-success" />
                <StatItem label="Largest Loss" value={stats.largestLoss} valueClassName="text-destructive" />
                <StatItem label="Avg. Winning Trade" value={stats.avgWin} valueClassName="text-success" />
                <StatItem label="Avg. Losing Trade" value={stats.avgLoss} valueClassName="text-destructive" />
                <StatItem label="Most Profitable Day" value={stats.mostProfitableDay} />
                <StatItem label="Least Profitable Day" value={stats.leastProfitableDay} />
                <StatItem label="Avg. Trades Per Day" value={stats.avgTradesPerDay} />
                <StatItem label="Avg. Trade Duration" value={stats.avgTradeDuration} />
            </CardContent>
        </Card>
    );
});
