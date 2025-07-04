
"use client"

import { useMemo } from 'react';
import type { Trade } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <ScrollArea className="h-full">
            {analytics.length > 0 ? (
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px] p-2">Strategy</TableHead>
                                <TableHead className="p-2">Win Rate</TableHead>
                                <TableHead className="text-right p-2">Avg. RR</TableHead>
                                <TableHead className="text-right p-2">Net R</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analytics.map(stat => (
                                <TableRow key={stat.strategy}>
                                    <TableCell className="font-medium truncate p-2">{stat.strategy}</TableCell>
                                    <TableCell className="p-2">
                                        <Tooltip delayDuration={150}>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={stat.winRate} className="h-2 w-16" indicatorClassName={stat.winRate >= 50 ? 'bg-success' : 'bg-destructive'}/>
                                                    <span className="text-xs text-muted-foreground w-10 text-right">{stat.winRate.toFixed(0)}%</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{stat.wins} Wins / {stat.losses} Losses</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="text-right p-2">{stat.avgRr.toFixed(2)}</TableCell>
                                    <TableCell className={cn(
                                        "text-right font-semibold p-2",
                                        stat.netR > 0 && "text-success",
                                        stat.netR < 0 && "text-destructive"
                                    )}>
                                        {stat.netR > 0 ? '+' : ''}{stat.netR.toFixed(2)}R
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                    <p>No strategy data to analyze.</p>
                </div>
            )}
        </ScrollArea>
    )
}
