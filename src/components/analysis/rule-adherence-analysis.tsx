
"use client";

import { useMemo, memo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from "@/components/ui/scroll-area";

type RuleAdherenceAnalysisProps = {
    trades: Trade[];
    tradingRules: string[];
};

export const RuleAdherenceAnalysis = memo(function RuleAdherenceAnalysis({ trades, tradingRules }: RuleAdherenceAnalysisProps) {
    const analytics = useMemo(() => {
        if (!tradingRules || tradingRules.length === 0) return [];

        return tradingRules.map(rule => {
            const tradesWhereRuleWasFollowed = trades.filter(trade => trade.rulesFollowed?.includes(rule));
            
            if (tradesWhereRuleWasFollowed.length === 0) {
                return {
                    rule,
                    adherenceCount: 0,
                    wins: 0,
                    losses: 0,
                    winRate: 0,
                    netR: 0,
                };
            }

            const wins = tradesWhereRuleWasFollowed.filter(t => t.result === 'Win').length;
            const losses = tradesWhereRuleWasFollowed.filter(t => t.result === 'Loss').length;
            
            const netR = tradesWhereRuleWasFollowed.reduce((acc, trade) => {
                if (trade.result === 'Win') return acc + (trade.rr || 0);
                if (trade.result === 'Loss') return acc - 1;
                return acc;
            }, 0);

            const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

            return {
                rule,
                adherenceCount: tradesWhereRuleWasFollowed.length,
                wins,
                losses,
                winRate,
                netR,
            };
        }).sort((a, b) => b.netR - a.netR); // Sort by most profitable rule

    }, [trades, tradingRules]);
    
    return (
        <ScrollArea className="h-full">
            {analytics.length > 0 ? (
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="p-2">Rule</TableHead>
                                <TableHead className="p-2 text-center">Adherence</TableHead>
                                <TableHead className="p-2">Win Rate</TableHead>
                                <TableHead className="text-right p-2">Net R</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {analytics.map(stat => (
                                <TableRow key={stat.rule}>
                                    <TableCell className="font-medium truncate p-2 max-w-xs">{stat.rule}</TableCell>
                                    <TableCell className="text-center p-2">{stat.adherenceCount}</TableCell>
                                    <TableCell className="p-2">
                                        {stat.adherenceCount > 0 ? (
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
                                        ) : (
                                            <span className="text-xs text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className={cn(
                                        "text-right font-semibold p-2",
                                        stat.netR > 0 && "text-success",
                                        stat.netR < 0 && "text-destructive"
                                    )}>
                                        {stat.netR.toFixed(2)}R
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                    <p>No trading rules defined or followed yet.</p>
                </div>
            )}
        </ScrollArea>
    );
});
