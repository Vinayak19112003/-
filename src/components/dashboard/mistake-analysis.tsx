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
    "hsl(var(--chart-2))",
    "hsl(var(--chart-1))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">Mistake</span>
              <span className="font-bold">{data.payload.name}</span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-sm text-muted-foreground">Count</span>
              <span className="font-bold">{data.value}</span>
            </div>
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
                                    cy="45%"
                                    labelLine={false}
                                    outerRadius={80}
                                    innerRadius={50}
                                    dataKey="value"
                                    paddingAngle={2}
                                >
                                    {mistakeCounts.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none stroke-background" strokeWidth={2}/>
                                    ))}
                                </Pie>
                                <Tooltip
                                    cursor={{ fill: 'hsla(var(--accent) / 0.1)' }}
                                    content={<CustomTooltip />}
                                />
                                <Legend 
                                    iconSize={10} 
                                    wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}
                                    verticalAlign="bottom"
                                    align="center"
                                />
                            </PieChart>
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
