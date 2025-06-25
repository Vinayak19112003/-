"use client";

import { useMemo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";

type MistakeAnalysisProps = {
    trades: Trade[];
};

export function MistakeAnalysis({ trades }: MistakeAnalysisProps) {
    const { theme } = useTheme();

    const mistakeCounts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        trades.forEach(trade => {
            trade.mistakes?.forEach(mistake => {
                counts[mistake] = (counts[mistake] || 0) + 1;
            });
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [trades]);

    const tickColor = theme === 'dark' ? '#888888' : '#333333';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mistake Analysis</CardTitle>
                <CardDescription>Frequency of your common trading errors.</CardDescription>
            </CardHeader>
            <CardContent>
                {mistakeCounts.length > 0 ? (
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mistakeCounts} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis type="number" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} width={80} />
                                <Tooltip
                                    cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                                    contentStyle={{
                                        background: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                    }}
                                />
                                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[250px] flex items-center justify-center text-center text-muted-foreground">
                        No mistakes logged in this period. Great job!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
