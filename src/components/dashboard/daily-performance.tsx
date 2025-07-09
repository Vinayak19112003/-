
"use client";

import { useMemo, memo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { StreamerModeText } from '@/components/streamer-mode-text';

type DailyPerformanceProps = {
    trades: Trade[];
};

export const DailyPerformance = memo(function DailyPerformance({ trades }: DailyPerformanceProps) {
    const dailyStats = useMemo(() => {
        const statsByDay: { [key: string]: { date: Date, trades: Trade[] } } = {};

        trades.forEach(trade => {
            const dateKey = format(trade.date, 'yyyy-MM-dd');
            if (!statsByDay[dateKey]) {
                statsByDay[dateKey] = { date: trade.date, trades: [] };
            }
            statsByDay[dateKey].trades.push(trade);
        });
        
        return Object.values(statsByDay).map(day => {
            const numTrades = day.trades.length;
            const wins = day.trades.filter(t => t.result === 'Win').length;
            const losses = day.trades.filter(t => t.result === 'Loss').length;
            
            const totalPnl = day.trades.reduce((acc, t) => acc + (t.pnl || 0), 0);
            const netR = day.trades.reduce((acc, t) => {
                if (t.result === 'Win') return acc + (t.rr || 0);
                if (t.result === 'Loss') return acc - 1;
                return acc;
            }, 0);

            const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
            const avgR = numTrades > 0 ? netR / numTrades : 0;

            const tradesWithAccountSize = day.trades.filter(t => t.accountSize && t.accountSize > 0);
            const avgAccountSize = tradesWithAccountSize.length > 0 ? tradesWithAccountSize.reduce((sum, t) => sum + t.accountSize!, 0) / tradesWithAccountSize.length : 0;
            const returnPercentage = avgAccountSize > 0 ? (totalPnl / avgAccountSize) * 100 : 0;
            
            return {
                date: day.date,
                trades: numTrades,
                pnl: totalPnl,
                winRate,
                avgR,
                returnPercentage,
            };
        }).sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daily Performance</CardTitle>
                <CardDescription>A day-by-day breakdown of your trading activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Trades</TableHead>
                                <TableHead className="text-right">Win Rate</TableHead>
                                <TableHead className="text-right">Avg. R</TableHead>
                                <TableHead className="text-right">Return %</TableHead>
                                <TableHead className="text-right">PNL ($)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailyStats.length > 0 ? (
                                dailyStats.map(stat => (
                                    <TableRow key={format(stat.date, 'yyyy-MM-dd')}>
                                        <TableCell className="font-medium">{format(stat.date, 'MMM dd, yyyy')}</TableCell>
                                        <TableCell className="text-center">{stat.trades}</TableCell>
                                        <TableCell className="text-right">{stat.winRate.toFixed(1)}%</TableCell>
                                        <TableCell className={cn(
                                            "text-right font-semibold",
                                            stat.avgR > 0 && "text-success",
                                            stat.avgR < 0 && "text-destructive"
                                        )}>
                                            {stat.avgR.toFixed(2)}R
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-semibold",
                                            stat.returnPercentage > 0 && "text-success",
                                            stat.returnPercentage < 0 && "text-destructive"
                                        )}>
                                            <StreamerModeText>{stat.returnPercentage.toFixed(2)}%</StreamerModeText>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-semibold",
                                            stat.pnl > 0 && "text-success",
                                            stat.pnl < 0 && "text-destructive"
                                        )}>
                                            <StreamerModeText>{stat.pnl >= 0 ? '+' : ''}${stat.pnl.toFixed(2)}</StreamerModeText>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No performance data available for this period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
});
