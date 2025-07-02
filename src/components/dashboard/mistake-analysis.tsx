"use client";

import { useMemo, useState, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from '@/components/ui/skeleton';

type MistakeAnalysisProps = {
    trades: Trade[];
};

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const { name, value } = data.payload;
      return (
        <div className="rounded-lg border bg-background p-2.5 text-sm shadow-xl">
          <div className="mb-2 font-medium">{name}</div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Frequency</span>
            <span className="font-bold">{value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

export function MistakeAnalysis({ trades }: MistakeAnalysisProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const mistakeCounts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        trades.forEach(trade => {
            trade.mistakes?.forEach(mistake => {
                counts[mistake] = (counts[mistake] || 0) + 1;
            });
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [trades]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mistake Analysis</CardTitle>
                <CardDescription>Frequency of your common errors.</CardDescription>
            </CardHeader>
            <CardContent>
                 {!mounted ? (
                    <Skeleton className="h-[250px] w-full" />
                ) : mistakeCounts.length > 0 ? (
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mistakeCounts}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    innerRadius={70}
                                    dataKey="value"
                                    paddingAngle={3}
                                >
                                    {mistakeCounts.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]} 
                                            className="focus:outline-none" 
                                            stroke="hsl(var(--background))" 
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    cursor={{ fill: 'hsla(var(--accent) / 0.1)' }}
                                    contentStyle={{
                                        background: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                        boxShadow: '0 4px 12px hsla(var(--foreground) / 0.1)',
                                    }}
                                    content={<CustomTooltip />}
                                />
                                <Legend 
                                    iconSize={12} 
                                    wrapperStyle={{fontSize: "14px", paddingTop: "20px"}}
                                    verticalAlign="bottom"
                                    align="center"
                                    layout="horizontal"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[250px] flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-success mb-2">
                           <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path>
                        </svg>
                        <p className="font-semibold">No Mistakes Logged</p>
                        <p className="text-sm">Great job! No errors recorded in this period.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
