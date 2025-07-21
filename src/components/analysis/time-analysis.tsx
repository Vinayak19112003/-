
"use client";

import { useMemo, useState, useEffect, memo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';

type TimeAnalysisProps = {
  trades: Trade[];
};

export const TimeAnalysis = memo(function TimeAnalysis({ trades }: TimeAnalysisProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const hourlyStats = useMemo(() => {
        const stats: { [hour: number]: { trades: number; wins: number; losses: number; netR: number } } = {};

        for (let i = 0; i < 24; i++) {
            stats[i] = { trades: 0, wins: 0, losses: 0, netR: 0 };
        }

        trades.forEach(trade => {
            if (!trade.entryTime) return;
            const hour = parseInt(trade.entryTime.split(':')[0], 10);
            if (isNaN(hour)) return;
            
            stats[hour].trades++;
            let rValue = 0;
            if (trade.result === 'Win') {
                stats[hour].wins++;
                rValue = trade.rr || 0;
            } else if (trade.result === 'Loss') {
                stats[hour].losses++;
                rValue = -1;
            }
            stats[hour].netR += rValue;
        });

        const chartData = Object.entries(stats)
            .filter(([, data]) => data.trades > 0) // Only show hours with trades
            .map(([hourStr, data]) => {
                const hour = parseInt(hourStr, 10);
                const winRate = data.wins + data.losses > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0;
                let period = 'AM';
                let displayHour = hour;
                if (hour === 0) {
                    displayHour = 12;
                } else if (hour === 12) {
                    period = 'PM';
                } else if (hour > 12) {
                    displayHour = hour - 12;
                    period = 'PM';
                }
                return {
                    hour: `${displayHour} ${period}`,
                    netR: parseFloat(data.netR.toFixed(2)),
                    winRate: parseFloat(winRate.toFixed(1)),
                    trades: data.trades,
                };
            });
            
        // Find best and worst hours for summary text
        let bestHour: any = null;
        let worstHour: any = null;

        if(chartData.length > 0) {
            bestHour = chartData.reduce((prev, current) => (prev.netR > current.netR) ? prev : current);
            worstHour = chartData.reduce((prev, current) => (prev.netR < current.netR) ? prev : current);
        }

        return { chartData, bestHour, worstHour };
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
                        <div className="col-span-2 font-bold mb-1">Time: {label}</div>
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
    
    if (!mounted) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Time-Based Performance</CardTitle>
                <CardDescription>
                    {hourlyStats.bestHour && hourlyStats.worstHour ? (
                        `Your most profitable period is around ${hourlyStats.bestHour.hour}, while performance dips near ${hourlyStats.worstHour.hour}.`
                    ) : (
                        'Analyze trade performance based on the hour of entry.'
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
                {hourlyStats.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyStats.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="hour" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Net R', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 12, dy: 40 }}/>
                            <Tooltip
                                cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="netR">
                                {hourlyStats.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.netR >= 0 ? successColor : destructiveColor} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                        Not enough trade data with entry times to analyze hourly performance.
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
