
"use client";

import { useMemo, memo, useState, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from "next-themes";
import { Skeleton } from '@/components/ui/skeleton';

type RMultipleDistributionProps = {
    trades: Trade[];
};

export default memo(function RMultipleDistribution({ trades }: RMultipleDistributionProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const rMultipleData = useMemo(() => {
        if (trades.length === 0) return [];
        
        const rMultiples = trades.map(t => t.result === 'Loss' ? -1 : (t.rr || 0));
        
        const maxR = Math.max(...rMultiples.map(Math.abs));
        const binSize = Math.ceil(maxR / 10) || 1;
        const bins: { [key: string]: { name: string, range: [number, number], wins: number, losses: number } } = {};

        for (let i = -1; i < maxR + binSize; i += binSize) {
             const start = i < 0 ? -1 : Math.floor(i);
             const end = start + binSize;
             const name = start < 0 ? '-1R' : `${start}-${end}R`;
             bins[name] = { name, range: [start, end], wins: 0, losses: 0 };
        }
        
        rMultiples.forEach(r => {
             if (r < 0) {
                if (bins['-1R']) bins['-1R'].losses++;
             } else {
                 const binKey = Object.keys(bins).find(k => {
                     const bin = bins[k];
                     return r >= bin.range[0] && r < bin.range[1];
                 });
                 if (binKey && bins[binKey]) {
                     bins[binKey].wins++;
                 }
             }
        });

        return Object.values(bins).filter(b => b.wins > 0 || b.losses > 0);
    }, [trades]);

    const tickColor = theme === 'dark' ? '#888888' : '#333333';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <Card>
            <CardHeader>
                <CardTitle>R-Multiple Distribution</CardTitle>
                <CardDescription>Frequency of trade outcomes by R-multiple.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
                {!mounted ? (
                    <Skeleton className="h-full w-full" />
                ) : rMultipleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rMultipleData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
                        No trade data with R-multiples to show distribution.
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
