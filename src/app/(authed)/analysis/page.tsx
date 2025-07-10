
"use client";

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay } from "date-fns";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Trade } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { useTradingRules } from "@/hooks/use-trading-rules";
import { useToast } from "@/hooks/use-toast";

const PatternAnalysis = dynamic(() => import('@/components/dashboard/pattern-analysis').then(mod => mod.PatternAnalysis), { ssr: false, loading: () => <Skeleton className="h-10 w-32" /> });
const SharePerformance = dynamic(() => import('@/components/dashboard/share-performance').then(mod => mod.SharePerformance), { ssr: false, loading: () => <Skeleton className="h-10 w-24" /> });
const StrategyAnalytics = dynamic(() => import('@/components/dashboard/strategy-analytics').then(mod => mod.StrategyAnalytics), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const MistakeAnalysis = dynamic(() => import('@/components/dashboard/mistake-analysis').then(mod => mod.MistakeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const PerformanceRadarChart = dynamic(() => import('@/components/dashboard/performance-radar-chart'), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const RuleAdherenceAnalysis = dynamic(() => import('@/components/dashboard/rule-adherence-analysis').then(mod => mod.RuleAdherenceAnalysis), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const TimeAnalysis = dynamic(() => import('@/components/dashboard/time-analysis').then(mod => mod.TimeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const DailyPerformance = dynamic(() => import('@/components/dashboard/daily-performance').then(mod => mod.DailyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const MonthlyPerformance = dynamic(() => import('@/components/dashboard/monthly-performance').then(mod => mod.MonthlyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const DurationAnalysis = dynamic(() => import('@/components/dashboard/duration-analysis').then(mod => mod.DurationAnalysis), { ssr: false, loading: () => <Skeleton className="h-[340px]" /> });


export default function AnalysisPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { tradingRules } = useTradingRules();
    
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    useEffect(() => {
        const fetchTradesForRange = async () => {
            if (!user) {
                setTrades([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const tradesCollection = collection(db, 'users', user.uid, 'trades');
                
                let q;
                if (dateRange?.from && dateRange?.to) {
                     q = query(
                        tradesCollection, 
                        where('date', '>=', Timestamp.fromDate(dateRange.from)),
                        where('date', '<=', Timestamp.fromDate(endOfDay(dateRange.to))),
                        orderBy('date', 'desc')
                    );
                } else { // "All time" selected
                    q = query(tradesCollection, orderBy('date', 'desc'));
                }
                
                const querySnapshot = await getDocs(q);
                const fetchedTrades = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, date: doc.data().date.toDate() })) as Trade[];
                setTrades(fetchedTrades);

            } catch (error) {
                console.error("Error fetching trades for analysis:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch trade data for the selected range."
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTradesForRange();
    }, [user, dateRange, toast]);


    if (isLoading) {
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
                <div className="space-y-4 md:space-y-8">
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Analysis</h1>
                <div className="flex items-center gap-2">
                    <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
                    <PatternAnalysis trades={trades} />
                    <SharePerformance trades={trades} tradingRules={tradingRules} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Analytics</CardTitle>
                        <CardDescription>Performance breakdown by trading strategy.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <StrategyAnalytics trades={trades} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Mistake Analysis</CardTitle>
                        <CardDescription>Breakdown of your most common trading errors.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <MistakeAnalysis trades={trades} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Rule Adherence vs. Outcome</CardTitle>
                        <CardDescription>Analyze the impact of following your rules.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <RuleAdherenceAnalysis trades={trades} tradingRules={tradingRules} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>A radar view of your key performance indicators.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <PerformanceRadarChart trades={trades} tradingRules={tradingRules} />
                    </CardContent>
                </Card>
            </div>
            <TimeAnalysis trades={trades} />
            <DurationAnalysis trades={trades} />
            <DailyPerformance trades={trades} />
            <MonthlyPerformance trades={trades} />
        </div>
    );
}

    