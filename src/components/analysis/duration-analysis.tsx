
"use client";

import { useMemo, useState, useEffect, memo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { parse } from 'date-fns';

type DurationAnalysisProps = {
  trades: Trade[];
};

const DURATION_BUCKETS = [
    { label: '0-5m', max: 5 },
    { label: '5-15m', max: 15 },
    { label: '15-60m', max: 60 },
    { label: '1-4h', max: 240 },
    { label: '4-12h', max: 720 },
    { label: '>12h', max: Infinity },
];

export const DurationAnalysis = memo(function DurationAnalysis({ trades }: DurationAnalysisProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const durationStats = useMemo(() => {
        const stats = DURATION_BUCKETS.map(bucket => ({ ...bucket, trades: 0, netR: 0, wins: 0, losses: 0 }));

        trades.forEach(trade => {
            if (!trade.entryTime || !trade.exitTime) return;

            try {
                const entryDateTime = parse(`${trade.date.toISOString().split('T')[0]} ${trade.entryTime}`, 'yyyy-MM-dd HH:mm', new Date());
                const exitDateTime = parse(`${trade.date.toISOString().split('T')[0]} ${trade.exitTime}`, 'yyyy-MM-dd HH:mm', new Date());

                if (isNaN(entryDateTime.getTime()) || isNaN(exitDateTime.getTime())) return;
                
                // Handle overnight trades
                if (exitDateTime < entryDateTime) {
                    exitDateTime.setDate(exitDateTime.getDate() + 1);
                }

                const durationMinutes = (exitDateTime.getTime() - entryDateTime.getTime()) / (1000 * 60);
                if (durationMinutes < 0) return;

                const bucket = stats.find(b => durationMinutes <= b.max);
                if (!bucket) return;

                bucket.trades++;
                let rValue = 0;
                if (trade.result === 'Win') {
                    bucket.wins++;
                    rValue = trade.rr || 0;
                } else if (trade.result === 'Loss') {
                    bucket.losses++;
                    rValue = -1;
                }
                bucket.netR += rValue;
            } catch (error) {
                console.error("Error parsing trade times for duration analysis:", error, trade);
            }
        });

        const chartData = stats
            .map(bucket => ({
                name: bucket.label,
                netR: parseFloat(bucket.netR.toFixed(2)),
                trades: bucket.trades,
                winRate: bucket.wins + bucket.losses > 0 ? (bucket.wins / (bucket.wins + bucket.losses)) * 100 : 0,
            }));
            
        return { chartData };
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
                        <div className="col-span-2 font-bold mb-1">Duration: {label}</div>
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
                <CardContent className="h-[340px]">
                    <Skeleton className="h-full w-full" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Trade Duration Analysis</CardTitle>
                <CardDescription>
                   Discover which holding times are most profitable for your style.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
                {durationStats.chartData.some(d => d.trades > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={durationStats.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Net R', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 12, dy: 40 }}/>
                            <Tooltip
                                cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="netR" radius={[4, 4, 0, 0]}>
                                {durationStats.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.netR >= 0 ? successColor : destructiveColor} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                        Not enough trade data with entry and exit times to analyze duration.
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
