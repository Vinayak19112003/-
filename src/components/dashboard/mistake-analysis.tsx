
"use client";

import { useMemo, useState, useEffect } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2.5 text-sm shadow-xl">
          <div className="mb-2 font-medium">{data.name}</div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Frequency</span>
            <span className="font-bold">{data.value}</span>
          </div>
           <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Of total</span>
            <span className="font-bold">{(data.percent * 100).toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

export function MistakeAnalysis({ trades }: MistakeAnalysisProps) {
    const [mounted, setMounted] = useState(false);
    const [hoveredData, setHoveredData] = useState<{ name: string; value: number; percent: number } | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const mistakeData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        trades.forEach(trade => {
            trade.mistakes?.forEach(mistake => {
                counts[mistake] = (counts[mistake] || 0) + 1;
            });
        });

        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value, percent: total > 0 ? value / total : 0 }))
            .sort((a, b) => b.value - a.value);
    }, [trades]);

    // Set initial hovered data to the most frequent mistake
    useEffect(() => {
        if (mistakeData.length > 0) {
            setHoveredData(mistakeData[0]);
        } else {
            setHoveredData(null);
        }
    }, [mistakeData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mistake Analysis</CardTitle>
                <CardDescription>Hover over a slice to see details.</CardDescription>
            </CardHeader>
            <CardContent>
                 {!mounted ? (
                    <Skeleton className="h-[250px] w-full" />
                ) : mistakeData.length > 0 ? (
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mistakeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    innerRadius={75}
                                    dataKey="value"
                                    paddingAngle={2}
                                    onMouseEnter={(_, index) => setHoveredData(mistakeData[index])}
                                >
                                    {mistakeData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            className="focus:outline-none"
                                            stroke="hsl(var(--background))"
                                            strokeWidth={4}
                                            style={{
                                                transform: hoveredData && entry.name === hoveredData.name ? 'scale(1.05)' : 'scale(1)',
                                                transformOrigin: '50% 50%',
                                                transition: 'transform 200ms ease-in-out',
                                            }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    cursor={{ fill: 'hsla(var(--accent) / 0.1)' }}
                                    content={<CustomTooltip />}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-2">
                            {hoveredData && (
                                <>
                                    <span className="text-3xl font-bold font-headline">
                                        {(hoveredData.percent * 100).toFixed(1)}%
                                    </span>
                                    <span className="text-sm text-muted-foreground max-w-[120px] text-center truncate">{hoveredData.name}</span>
                                </>
                            )}
                        </div>
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
