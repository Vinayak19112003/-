
"use client";

import { useMemo, memo, useState, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from "next-themes";
import { Skeleton } from '@/components/ui/skeleton';
import { StreamerModeText } from '@/components/streamer-mode-text';

type PnlDistributionProps = {
    trades: Trade[];
};

export default memo(function PnlDistribution({ trades }: PnlDistributionProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const pnlData = useMemo(() => {
        if (trades.length === 0) return [];
        const pnls = trades.map(t => t.pnl || 0).filter(pnl => pnl !== 0);
        if (pnls.length === 0) return [];

        const maxPnl = Math.max(...pnls.map(Math.abs));
        const binSize = maxPnl / 10;
        const bins = Array.from({ length: 21 }, (_, i) => {
            const start = (i - 10) * binSize;
            return {
                name: `${start.toFixed(0)} to ${(start + binSize).toFixed(0)}`,
                range: [start, start + binSize],
                wins: 0,
                losses: 0,
            };
        });

        pnls.forEach(pnl => {
            const bin = bins.find(b => pnl >= b.range[0] && pnl < b.range[1]);
            if (bin) {
                if (pnl > 0) bin.wins++;
                else bin.losses++;
            }
        });

        return bins.filter(b => b.wins > 0 || b.losses > 0);
    }, [trades]);

    const tickColor = theme === 'dark' ? '#888888' : '#333333';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trade P&L Distribution</CardTitle>
                <CardDescription>Frequency of trade outcomes by P&L amount.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
                {!mounted ? (
                    <Skeleton className="h-full w-full" />
                ) : pnlData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pnlData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                              stroke={tickColor}
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                            />
                            <Bar dataKey="wins" name="Wins" stackId="a" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="losses" name="Losses" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                        No trade data with P&L to show distribution.
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
