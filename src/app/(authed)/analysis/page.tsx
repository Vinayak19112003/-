
"use client";

import { useState, useMemo, useEffect } from "react";
import { useTrades } from "@/hooks/use-trades";
import { useTradingRules } from "@/hooks/use-trading-rules";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { startOfMonth } from "date-fns";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { PatternAnalysis } from "@/components/dashboard/pattern-analysis";
import { StrategyAnalytics } from "@/components/dashboard/strategy-analytics";
import { MistakeAnalysis } from "@/components/dashboard/mistake-analysis";
import { PerformanceRadarChart } from "@/components/dashboard/performance-radar-chart";
import { RuleAdherenceAnalysis } from "@/components/dashboard/rule-adherence-analysis";
import { TimeAnalysis } from "@/components/dashboard/time-analysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SharePerformance } from "@/components/dashboard/share-performance";

export default function AnalysisPage() {
    const { trades, isLoaded } = useTrades();
    const { tradingRules } = useTradingRules();

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    const filteredTrades = useMemo(() => {
        if (!dateRange?.from) return trades;
        return trades.filter(trade => {
            const tradeDate = new Date(trade.date);
            const fromDate = new Date(dateRange.from!);
            fromDate.setHours(0, 0, 0, 0);

            if (dateRange.to) {
                const toDate = new Date(dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                return tradeDate >= fromDate && tradeDate <= toDate;
            }
            return tradeDate >= fromDate;
        });
    }, [trades, dateRange]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !isLoaded) {
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
