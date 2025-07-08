
"use client";

import { useMemo, useState, useEffect, memo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from '@/components/ui/skeleton';

type MistakeAnalysisProps = {
    trades: Trade[];
};

const COLORS = [
    "hsl(var(--destructive))",
    "hsl(0, 70%, 65%)",
    "hsl(15, 80%, 60%)",
    "hsl(30, 90%, 55%)",
    "hsl(45, 95%, 50%)",
];

export const MistakeAnalysis = memo(function MistakeAnalysis({ trades }: MistakeAnalysisProps) {
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
        <div className="h-full">
            {!mounted ? (
                <Skeleton className="h-[180px] w-full" />
            ) : mistakeData.length > 0 ? (
                <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={mistakeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                innerRadius={60}
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
                        </PieChart>
                    </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-2">
                        {hoveredData ? (
                            <>
                                <span className="text-3xl font-bold font-headline">
                                    {(hoveredData.percent * 100).toFixed(1)}%
                                </span>
                                <span className="text-sm text-muted-foreground max-w-[120px] text-center truncate">{hoveredData.name}</span>
                            </>
                        ) : (
                            <span className="text-lg font-bold font-headline">
                                Mistakes
                            </span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="h-[180px] flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-success mb-2">
                       <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path>
                    </svg>
                    <p className="font-semibold">No Mistakes Logged</p>
                    <p className="text-sm">Great job! No errors recorded in this period.</p>
                </div>
            )}
        </div>
    );
});
