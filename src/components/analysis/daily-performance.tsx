
"use client";

import { useMemo, memo, useState, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from "next-themes";
import { Skeleton } from '@/components/ui/skeleton';
import { getDay } from 'date-fns';
import { StreamerModeText } from '@/components/streamer-mode-text';

type DailyPerformanceProps = {
    trades: Trade[];
};

export const DailyPerformance = memo(function DailyPerformance({ trades }: DailyPerformanceProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const dailyStats = useMemo(() => {
        const stats = [
            { name: 'Sun', pnl: 0, trades: 0 },
            { name: 'Mon', pnl: 0, trades: 0 },
            { name: 'Tue', pnl: 0, trades: 0 },
            { name: 'Wed', pnl: 0, trades: 0 },
            { name: 'Thu', pnl: 0, trades: 0 },
            { name: 'Fri', pnl: 0, trades: 0 },
            { name: 'Sat', pnl: 0, trades: 0 },
        ];

        trades.forEach(trade => {
            const dayIndex = getDay(trade.date); // 0 for Sunday
            if (trade.pnl) {
                stats[dayIndex].pnl += trade.pnl;
            }
            stats[dayIndex].trades++;
        });

        return stats.map(day => ({
            ...day,
            pnl: parseFloat(day.pnl.toFixed(2))
        }));
    }, [trades]);
    
    const hasData = useMemo(() => dailyStats.some(d => d.trades > 0), [dailyStats]);

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
                <CardTitle>Performance by Day of Week</CardTitle>
                <CardDescription>Performance breakdown by day of the week.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
                {!mounted ? (
                    <Skeleton className="h-full w-full" />
                ) : hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyStats} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                {dailyStats.map((entry, index) => (
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
