
"use client";

import { useState, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useTrades } from "@/contexts/trades-context";
import { useTradingRules } from "@/hooks/use-trading-rules";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { startOfMonth, isWithinInterval } from "date-fns";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SharePerformance } from "@/components/dashboard/share-performance";

const PatternAnalysis = dynamic(() => import('@/components/dashboard/pattern-analysis').then(mod => mod.PatternAnalysis), { ssr: false, loading: () => <Skeleton className="h-10 w-32" /> });
const StrategyAnalytics = dynamic(() => import('@/components/dashboard/strategy-analytics').then(mod => mod.StrategyAnalytics), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const MistakeAnalysis = dynamic(() => import('@/components/dashboard/mistake-analysis').then(mod => mod.MistakeAnalysis), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const PerformanceRadarChart = dynamic(() => import('@/components/dashboard/performance-radar-chart').then(mod => mod.PerformanceRadarChart), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const RuleAdherenceAnalysis = dynamic(() => import('@/components/dashboard/rule-adherence-analysis').then(mod => mod.RuleAdherenceAnalysis), { ssr: false, loading: () => <Skeleton className="h-full w-full" /> });
const TimeAnalysis = dynamic(() => import('@/components/dashboard/time-analysis').then(mod => mod.TimeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });

export default function AnalysisPage() {
    const { trades, isLoaded } = useTrades();
    const { tradingRules } = useTradingRules();

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    const filteredTrades = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return trades;
        }
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return trades.filter(trade => 
          isWithinInterval(new Date(trade.date), { start: dateRange.from!, end: toDate })
        );
      }, [trades, dateRange]);


    if (!isLoaded) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-10 w-full sm:w-[470px]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <Skeleton className="h-[360px]" />
                    <Skeleton className="h-[360px]" />
                    <Skeleton className="h-[360px]" />
                    <Skeleton className="h-[360px]" />
                </div>
                <Skeleton className="h-[420px]" />
            </div>
        );
    }
    
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Analysis</h1>
                <div className="flex items-center gap-2">
                    <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
                    <PatternAnalysis trades={filteredTrades} />
                    <SharePerformance trades={filteredTrades} tradingRules={tradingRules} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Analytics</CardTitle>
                        <CardDescription>Performance breakdown by trading strategy.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <StrategyAnalytics trades={filteredTrades} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Mistake Analysis</CardTitle>
                        <CardDescription>Breakdown of your most common trading errors.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <MistakeAnalysis trades={filteredTrades} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Rule Adherence vs. Outcome</CardTitle>
                        <CardDescription>Analyze the impact of following your rules.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <RuleAdherenceAnalysis trades={filteredTrades} tradingRules={tradingRules} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>A radar view of your key performance indicators.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <PerformanceRadarChart trades={filteredTrades} tradingRules={tradingRules} />
                    </CardContent>
                </Card>
            </div>
            <TimeAnalysis trades={filteredTrades} />
        </>
    );
}
