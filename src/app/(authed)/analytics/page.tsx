
"use client";

/**
 * @fileoverview This file defines the Analysis page.
 * This page provides a deep dive into the user's trading data with various
 * analytical charts and tables. It fetches trade data based on a selectable
 * date range and passes it to different visualization components.
 */

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
import { useTrades } from "@/contexts/trades-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingModelPage from "./trading-model-view";
import DisciplineChecklistView from "./discipline-checklist-view";

// Dynamically import all charting components to reduce the initial bundle size.
// Skeletons are shown as placeholders while the components load.
const StrategyAnalytics = dynamic(() => import('@/components/analysis/strategy-analytics').then(mod => mod.StrategyAnalytics), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const MistakeAnalysis = dynamic(() => import('@/components/analysis/mistake-analysis').then(mod => mod.MistakeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const PerformanceRadarChart = dynamic(() => import('@/components/analysis/performance-radar-chart'), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const RuleAdherenceAnalysis = dynamic(() => import('@/components/analysis/rule-adherence-analysis').then(mod => mod.RuleAdherenceAnalysis), { ssr: false, loading: () => <Skeleton className="h-[300px] w-full" /> });
const TimeAnalysis = dynamic(() => import('@/components/analysis/time-analysis').then(mod => mod.TimeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const DailyPerformance = dynamic(() => import('@/components/analysis/daily-performance').then(mod => mod.DailyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const MonthlyPerformance = dynamic(() => import('@/components/analysis/monthly-performance').then(mod => mod.MonthlyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const DurationAnalysis = dynamic(() => import('@/components/analysis/duration-analysis').then(mod => mod.DurationAnalysis), { ssr: false, loading: () => <Skeleton className="h-[340px]" /> });

/**
 * The main component for the Analysis page.
 * It handles fetching trade data for a specific date range and rendering
 * the various analysis components within a tabbed interface.
 */
export default function AnalyticsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { tradingRules } = useTradingRules();
    const { refreshKey } = useTrades(); // Used to trigger a refetch when trades change.
    
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    // Effect to fetch trades whenever the user, date range, or refreshKey changes.
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
                     // Query for a specific date range.
                     q = query(
                        tradesCollection, 
                        where('date', '>=', Timestamp.fromDate(dateRange.from)),
                        where('date', '<=', Timestamp.fromDate(endOfDay(dateRange.to))),
                        orderBy('date', 'desc')
                    );
                } else { 
                    // Query for "All time" if no date range is selected.
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
    }, [user, dateRange, toast, refreshKey]);

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Analytics</h1>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="model">Trading Model</TabsTrigger>
                    <TabsTrigger value="discipline">Discipline Checklist</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                    {isLoading ? (
                         <div className="space-y-6 mt-4">
                            <Skeleton className="h-10 w-full sm:w-[470px] self-end" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                <Skeleton className="h-[360px]" />
                                <Skeleton className="h-[360px]" />
                                <Skeleton className="h-[360px]" />
                                <Skeleton className="h-[360px]" />
                            </div>
                         </div>
                    ) : (
                        <div className="space-y-4 md:space-y-6 mt-4">
                            <div className="flex justify-end">
                                <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle>Performance Metrics</CardTitle>
                                        <CardDescription>A radar view of your key performance indicators.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <PerformanceRadarChart trades={trades} tradingRules={tradingRules} />
                                    </CardContent>
                                </Card>
                                <Card className="lg:col-span-3">
                                    <CardHeader>
                                        <CardTitle>Rule Adherence vs. Outcome</CardTitle>
                                        <CardDescription>Analyze the impact of following your rules.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[300px]">
                                        <RuleAdherenceAnalysis trades={trades} tradingRules={tradingRules} />
                                    </CardContent>
                                </Card>
                            </div>
                            
                            <TimeAnalysis trades={trades} />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <DurationAnalysis trades={trades} />
                                <DailyPerformance trades={trades} />
                            </div>

                            <div className="w-full">
                                <MonthlyPerformance trades={trades} />
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="model" className="mt-4">
                   <TradingModelPage />
                </TabsContent>
                <TabsContent value="discipline" className="mt-4">
                    <DisciplineChecklistView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
