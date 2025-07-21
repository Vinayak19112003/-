
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
import type { Trade } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy, CollectionReference, Query } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useTrades } from "@/contexts/trades-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingModelPage from "./trading-model-view";
import { useAccountContext } from "@/contexts/account-context";

// Dynamically import all charting components to reduce the initial bundle size.
// Skeletons are shown as placeholders while the components load.
const CoreMetrics = dynamic(() => import('@/components/analysis/core-metrics'), { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> });
const RiskRewardMetrics = dynamic(() => import('@/components/analysis/risk-reward-metrics'), { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> });
const DrawdownStreakAnalysis = dynamic(() => import('@/components/analysis/drawdown-streak-analysis'), { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> });
const SystemQualityMetrics = dynamic(() => import('@/components/analysis/system-quality-metrics'), { ssr: false, loading: () => <Skeleton className="h-[250px] w-full" /> });

const DailyPerformance = dynamic(() => import('@/components/analysis/daily-performance').then(mod => mod.DailyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const MonthlyPerformance = dynamic(() => import('@/components/analysis/monthly-performance').then(mod => mod.MonthlyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const SessionAnalysis = dynamic(() => import('@/components/analysis/session-analysis'), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const PnlDistribution = dynamic(() => import('@/components/analysis/pnl-distribution'), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const RMultipleDistribution = dynamic(() => import('@/components/analysis/r-multiple-distribution'), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });


/**
 * The main component for the Analysis page.
 * It handles fetching trade data for a specific date range and rendering
 * the various analysis components within a tabbed interface.
 */
export default function AnalyticsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { refreshKey } = useTrades(); // Used to trigger a refetch when trades change.
    const { selectedAccountId } = useAccountContext();
    
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: new Date(),
    });

    // Effect to fetch trades whenever the user, date range, or refreshKey changes.
    useEffect(() => {
        const fetchTradesForRange = async () => {
            if (!user || !selectedAccountId) {
                setTrades([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const tradesCollection = collection(db, 'users', user.uid, 'trades') as CollectionReference<Trade>;
                
                const queries: any[] = [
                    where('accountId', '==', selectedAccountId),
                    orderBy('date', 'desc')
                ];

                if (dateRange?.from) {
                     queries.unshift(where('date', '>=', Timestamp.fromDate(dateRange.from)));
                }
                if (dateRange?.to) {
                     queries.unshift(where('date', '<=', Timestamp.fromDate(endOfDay(dateRange.to))));
                }
                
                const q = query(tradesCollection, ...queries);
                
                const querySnapshot = await getDocs(q);
                const fetchedTrades = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, date: (doc.data().date as unknown as Timestamp).toDate() })) as Trade[];
                setTrades(fetchedTrades);

            } catch (error: any) {
                if (error.code === 'failed-precondition') {
                    console.error("Firebase Index Required:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Firebase Index Required',
                        description: 'Please create the required Firestore index by clicking the link in the console error.',
                        duration: 10000,
                    });
                } else {
                    console.error("Error fetching trades for analysis:", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not fetch trade data for the selected range."
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTradesForRange();
    }, [user, dateRange, toast, refreshKey, selectedAccountId]);

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Analytics</h1>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="model">Trading Model</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                    {isLoading ? (
                         <div className="space-y-6 mt-4">
                            <Skeleton className="h-10 w-full sm:w-[470px] self-end" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                                <Skeleton className="h-[250px]" />
                                <Skeleton className="h-[250px]" />
                                <Skeleton className="h-[250px]" />
                                <Skeleton className="h-[250px]" />
                            </div>
                         </div>
                    ) : (
                        <div className="space-y-4 md:space-y-6 mt-4">
                            <div className="flex justify-end">
                                <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <CoreMetrics trades={trades} />
                                <RiskRewardMetrics trades={trades} />
                                <DrawdownStreakAnalysis trades={trades} />
                                <SystemQualityMetrics trades={trades} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <DailyPerformance trades={trades} />
                                <MonthlyPerformance trades={trades} />
                            </div>
                            
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                <PnlDistribution trades={trades} />
                                <RMultipleDistribution trades={trades} />
                            </div>

                            <div className="w-full">
                                <SessionAnalysis trades={trades} />
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="model" className="mt-4">
                   <TradingModelPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}
