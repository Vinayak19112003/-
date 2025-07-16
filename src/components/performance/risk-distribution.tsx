
"use client";

import { useMemo, useState, useEffect, memo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

type RiskDistributionProps = {
  trades: Trade[];
};

const RISK_BINS = {
    Low: { max: 50, name: 'Low (≤$50)' },
    Medium: { max: 100, name: 'Medium ($51-$100)' },
    High: { max: Infinity, name: 'High (>$100)' },
};

export const RiskDistribution = memo(function RiskDistribution({ trades }: RiskDistributionProps) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);

    const riskStats = useMemo(() => {
        const stats: { [key: string]: { trades: number, netR: number, name: string } } = {
            Low: { trades: 0, netR: 0, name: RISK_BINS.Low.name },
            Medium: { trades: 0, netR: 0, name: RISK_BINS.Medium.name },
            High: { trades: 0, netR: 0, name: RISK_BINS.High.name },
        };

        trades.forEach(trade => {
            if (trade.accountSize && trade.riskPercentage) {
                const riskAmount = trade.accountSize * (trade.riskPercentage / 100);
                
                let binKey: keyof typeof RISK_BINS | null = null;
                if (riskAmount <= RISK_BINS.Low.max) {
                    binKey = 'Low';
                } else if (riskAmount <= RISK_BINS.Medium.max) {
                    binKey = 'Medium';
                } else {
                    binKey = 'High';
                }

                if (binKey) {
                    stats[binKey].trades++;
                    let rValue = 0;
                    if (trade.result === 'Win') {
                        rValue = trade.rr || 0;
                    } else if (trade.result === 'Loss') {
                        rValue = -1;
                    }
                    stats[binKey].netR += rValue;
                }
            }
        });
        
        return Object.values(stats).map(s => ({...s, netR: parseFloat(s.netR.toFixed(2))}));

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
                        <div className="col-span-2 font-bold mb-1">{label}</div>
                        <div className="text-muted-foreground">Net R</div>
                        <div className={cn("font-semibold text-right", data.netR > 0 ? "text-success" : "text-destructive")}>{data.netR.toFixed(2)}R</div>
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
                <CardContent className="h-[300px]">
                    <Skeleton className="h-full w-full" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CircleDot className="h-5 w-5 text-primary" />
                    Risk Distribution
                </CardTitle>
                <CardDescription>
                    Profitability (Net R) per risk category.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                {riskStats.some(d => d.trades > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskStats} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Net R', angle: -90, position: 'insideLeft', fill: tickColor, fontSize: 12, dy: 40 }}/>
                            <Tooltip
                                cursor={{ fill: 'hsla(var(--accent) / 0.2)' }}
                                content={<CustomTooltip />}
                            />
                            <Bar dataKey="netR" radius={[4, 4, 0, 0]}>
                                {riskStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.netR >= 0 ? successColor : destructiveColor} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground p-4 text-center">
                        Not enough trade data with account size and risk % to analyze risk distribution.
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
