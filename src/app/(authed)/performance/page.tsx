
"use client";

/**
 * @fileoverview This file defines the Performance page.
 * This page provides a deep dive into risk analytics and performance metrics,
 * focusing on drawdown, risk-adjusted returns, and overall consistency.
 */

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, CollectionReference, where, Query, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useTrades } from "@/contexts/trades-context";
import { useAccountContext } from "@/contexts/account-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingRules } from "@/hooks/use-trading-rules";

// Dynamically import tab content
const RiskAnalysisTab = dynamic(() => import('@/components/performance/risk-analysis-tab'), { ssr: false, loading: () => <TabSkeleton /> });
const PsychologyTab = dynamic(() => import('@/components/performance/psychology-tab'), { ssr: false, loading: () => <TabSkeleton /> });
const TimeAnalysisTab = dynamic(() => import('@/components/performance/time-analysis-tab'), { ssr: false, loading: () => <TabSkeleton /> });
const PlaybookTab = dynamic(() => import('@/components/performance/playbook-tab'), { ssr: false, loading: () => <TabSkeleton /> });

const TabSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[250px]" />
        <Skeleton className="h-[250px]" />
    </div>
)

/**
 * The main component for the Performance page.
 * It handles fetching all trade data and passing it to the risk analysis components.
 */
export default function PerformancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { refreshKey } = useTrades();
    const { selectedAccountId } = useAccountContext();
    const { tradingRules } = useTradingRules();
    
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to fetch all trades for performance analysis
    useEffect(() => {
        const fetchAllTrades = async () => {
            if (!user || !selectedAccountId) {
                setTrades([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const tradesCollection = collection(db, 'users', user.uid, 'trades') as CollectionReference<Trade>;
                
                const q = query(tradesCollection, where('accountId', '==', selectedAccountId), orderBy('date', 'asc'));
                
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
                    console.error("Error fetching trades for performance analysis:", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not fetch trade data for performance analysis."
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllTrades();
    }, [user, toast, refreshKey, selectedAccountId]);

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Performance</h1>
            </div>

             <Tabs defaultValue="risk-analysis">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
                    <TabsTrigger value="psychology">Psychology</TabsTrigger>
                    <TabsTrigger value="time-analysis">Time Analysis</TabsTrigger>
                    <TabsTrigger value="playbook">Playbook</TabsTrigger>
                </TabsList>
                
                <TabsContent value="risk-analysis" className="mt-4">
                   {isLoading ? <TabSkeleton /> : <RiskAnalysisTab trades={trades} />}
                </TabsContent>
                <TabsContent value="psychology" className="mt-4">
                    {isLoading ? <TabSkeleton /> : <PsychologyTab trades={trades} />}
                </TabsContent>
                <TabsContent value="time-analysis" className="mt-4">
                    {isLoading ? <TabSkeleton /> : <TimeAnalysisTab trades={trades} />}
                </TabsContent>
                <TabsContent value="playbook" className="mt-4">
                    {isLoading ? <TabSkeleton /> : <PlaybookTab trades={trades} tradingRules={tradingRules} />}
                </TabsContent>
            </Tabs>
        </div>
    );
}
