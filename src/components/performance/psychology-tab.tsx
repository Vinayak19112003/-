
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PatternAnalysis } from '@/components/analysis/pattern-analysis';

// Dynamically import charting components
const MistakeAnalysis = dynamic(() => import('@/components/analysis/mistake-analysis').then(mod => mod.MistakeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[250px]" /> });
const PerformanceRadarChart = dynamic(() => import('@/components/analysis/performance-radar-chart'), { ssr: false, loading: () => <Skeleton className="h-[300px]" /> });

export default function PsychologyTab({ trades }: { trades: Trade[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Mistake Frequency</CardTitle>
                    <CardDescription>Most common errors made.</CardDescription>
                </CardHeader>
                <CardContent>
                    <MistakeAnalysis trades={trades} />
                </CardContent>
                 <CardHeader className="pt-0">
                    <CardTitle>AI Pattern Analysis</CardTitle>
                    <CardDescription>Get psychological insights from your journal notes.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <PatternAnalysis trades={trades} />
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>A holistic view of your trading skills.</CardDescription>
                </CardHeader>
                 <CardContent className="h-[400px]">
                    {/* Assuming tradingRules are handled higher up or not needed here */}
                    <PerformanceRadarChart trades={trades} tradingRules={[]} />
                </CardContent>
            </Card>
        </div>
    );
}
