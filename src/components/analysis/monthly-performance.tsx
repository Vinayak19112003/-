
"use client";

import { useMemo, memo, useState, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parse } from 'date-fns';
import { useTheme } from "next-themes";
import { Skeleton } from '@/components/ui/skeleton';
import { StreamerModeText } from '@/components/streamer-mode-text';

type MonthlyPerformanceProps = {
    trades: Trade[];
};

export const MonthlyPerformance = memo(function MonthlyPerformance({ trades }: MonthlyPerformanceProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const monthlyStats = useMemo(() => {
        const statsByMonth: { [key: string]: { date: Date, trades: Trade[], pnl: number, netR: number } } = {};

        trades.forEach(trade => {
            const monthKey = format(trade.date, 'yyyy-MM');
            if (!statsByMonth[monthKey]) {
                statsByMonth[monthKey] = { date: trade.date, trades: [], pnl: 0, netR: 0 };
            }
            statsByMonth[monthKey].trades.push(trade);
            statsByMonth[monthKey].pnl += trade.pnl || 0;
            if (trade.result === 'Win') {
                statsByMonth[monthKey].netR += trade.rr || 0;
            } else if (trade.result === 'Loss') {
                statsByMonth[monthKey].netR -= 1;
            }
        });
        
        return Object.entries(statsByMonth)
            .map(([monthKey, monthData]) => {
                const numTrades = monthData.trades.length;
                const wins = monthData.trades.filter(t => t.result === 'Win').length;
                const losses = monthData.trades.filter(t => t.result === 'Loss').length;
                const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
                
                return {
                    name: format(monthData.date, 'MMM yyyy'),
                    monthKey,
                    pnl: parseFloat(monthData.pnl.toFixed(2)),
                    netR: parseFloat(monthData.netR.toFixed(2)),
                    trades: numTrades,
                    winRate,
                };
            })
            .sort((a, b) => {
                const dateA = parse(a.monthKey, 'yyyy-MM', new Date());
                const dateB = parse(b.monthKey, 'yyyy-MM', new Date());
                return dateA.getTime() - dateB.getTime();
            });

    }, [trades]);

    const tickColor = theme === 'dark' ? '#888888' : '#333333';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const successColor = 'hsl(var(--success))';
    const destructiveColor = 'hsl(var(--destructive))';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="rounded-lg border bg-background p-2 shadow-sm text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="col-span-2 font-bold mb-1">{label}</div>
                        <div className="text-muted-foreground">PNL</div>
                        <div className="font-semibold text-right">
                           <StreamerModeText>{data.pnl >= 0 ? '+' : ''}${data.pnl.toFixed(2)}</StreamerModeText>
                        </div>

                        <div className="text-muted-foreground">Net R</div>
                        <div className="font-semibold text-right">{data.netR.toFixed(2)}R</div>

                        <div className="text-muted-foreground">Win Rate</div>
                        <div className="font-semibold text-right">{data.winRate.toFixed(1)}%</div>
                        
                        <div className="text-muted-foreground">Trades</div>
                        <div className="font-semibold text-right">{data.trades}</div>
                    </div>
                </div>
            );
        }
        return null;
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Performance Trend</CardTitle>
                <CardDescription>A month-by-month summary of your trading profitability.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
                {!mounted ? (
                  <Skeleton className="h-full w-full" />
                ) : monthlyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis 
                              stroke={tickColor} 
                              fontSize={12} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                {monthlyStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? successColor : destructiveColor} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                        No performance data available for this period.
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
