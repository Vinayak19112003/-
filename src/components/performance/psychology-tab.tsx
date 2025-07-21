
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PatternAnalysis } from '@/components/analysis/pattern-analysis';
import type { useTradingRules } from '@/hooks/use-trading-rules';

// Dynamically import charting components
const MistakeAnalysis = dynamic(() => import('@/components/analysis/mistake-analysis').then(mod => mod.MistakeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[180px]" /> });
const PerformanceRadarChart = dynamic(() => import('@/components/analysis/performance-radar-chart'), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });

export default function PsychologyTab({ trades, tradingRules }: { trades: Trade[], tradingRules: string[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Mistake Frequency</CardTitle>
                        <CardDescription>Most common trading errors.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MistakeAnalysis trades={trades} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>AI Pattern Analysis</CardTitle>
                        <CardDescription>Psychological insights from your journal notes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PatternAnalysis trades={trades} />
                    </CardContent>
                </Card>
            </div>
            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>A holistic view of your trading skills and discipline.</CardDescription>
                </CardHeader>
                 <CardContent className="h-[400px]">
                    <PerformanceRadarChart trades={trades} tradingRules={tradingRules} />
                </CardContent>
            </Card>
        </div>
    );
}
