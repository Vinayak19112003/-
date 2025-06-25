"use client"

import { useMemo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type StrategyAnalyticsProps = {
    trades: Trade[];
};

export function StrategyAnalytics({ trades }: StrategyAnalyticsProps) {
    const analytics = useMemo(() => {
        const statsByStrategy: { [key: string]: { totalTrades: number, wins: number, losses: number, totalRr: number, netR: number } } = {};

        trades.forEach(trade => {
            if (!statsByStrategy[trade.strategy]) {
                statsByStrategy[trade.strategy] = { totalTrades: 0, wins: 0, losses: 0, totalRr: 0, netR: 0 };
            }
            const stats = statsByStrategy[trade.strategy];
            stats.totalTrades++;

            if (trade.result === 'Win') {
                stats.wins++;
                stats.totalRr += trade.rr || 0;
                stats.netR += trade.rr || 0;
            } else if (trade.result === 'Loss') {
                stats.losses++;
                stats.netR -= 1;
            }
        });

        return Object.entries(statsByStrategy).map(([strategy, stats]) => {
            const winRate = (stats.wins + stats.losses) > 0 ? (stats.wins / (stats.wins + stats.losses)) * 100 : 0;
            const avgRr = stats.wins > 0 ? stats.totalRr / stats.wins : 0;
            return {
                strategy,
                ...stats,
                winRate,
                avgRr
            };
        }).sort((a,b) => b.netR - a.netR);

    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Strategy Analytics</CardTitle>
                <CardDescription>Performance breakdown by strategy.</CardDescription>
            </CardHeader>
            <CardContent>
                {analytics.length > 0 ? (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Strategy</TableHead>
                                <TableHead className="text-right">Net R</TableHead>
                                <TableHead className="text-right">W/R</TableHead>
                                <TableHead className="text-right">Avg RR</TableHead>
                                <TableHead className="text-right">Trades</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analytics.map(stat => (
                                <TableRow key={stat.strategy}>
                                    <TableCell className="font-medium">{stat.strategy}</TableCell>
                                    <TableCell className="text-right">{stat.netR.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{stat.winRate.toFixed(1)}%</TableCell>
                                    <TableCell className="text-right">{stat.avgRr.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">{stat.totalTrades}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">
                        No trade data to analyze.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
