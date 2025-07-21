
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamically import charting components
const StrategyAnalytics = dynamic(() => import('@/components/analysis/strategy-analytics').then(mod => mod.StrategyAnalytics), { ssr: false, loading: () => <Skeleton className="h-[300px]" /> });
const RuleAdherenceAnalysis = dynamic(() => import('@/components/analysis/rule-adherence-analysis').then(mod => mod.RuleAdherenceAnalysis), { ssr: false, loading: () => <Skeleton className="h-[300px]" /> });


export default function PlaybookTab({ trades, tradingRules }: { trades: Trade[], tradingRules: string[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Strategy Performance</CardTitle>
                    <CardDescription>Breakdown of profitability by strategy.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <StrategyAnalytics trades={trades} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Rule Adherence Performance</CardTitle>
                    <CardDescription>Profitability when following specific rules.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <RuleAdherenceAnalysis trades={trades} tradingRules={tradingRules} />
                </CardContent>
            </Card>
        </div>
    );
}
