
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

// Dynamically import charting components
const DrawdownAnalysis = dynamic(() => import('@/components/performance/drawdown-analysis').then(mod => mod.DrawdownAnalysis), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const RiskAdjustedReturns = dynamic(() => import('@/components/performance/risk-adjusted-returns').then(mod => mod.RiskAdjustedReturns), { ssr: false, loading: () => <Skeleton className="h-[250px]" /> });
const RiskDistribution = dynamic(() => import('@/components/performance/risk-distribution').then(mod => mod.RiskDistribution), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const AIRiskInsights = dynamic(() => import('@/components/performance/ai-risk-insights').then(mod => mod.AIRiskInsights), { ssr: false, loading: () => <Skeleton className="h-[250px]" /> });


/**
 * The main component for the Performance page.
 * It handles fetching all trade data and passing it to the risk analysis components.
 */
export default function PerformancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { refreshKey } = useTrades();
    const { selectedAccountId } = useAccountContext();
    
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Effect to fetch all trades for performance analysis
    useEffect(() => {
        const fetchAllTrades = async () => {
            if (!user) {
                setTrades([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const tradesCollection = collection(db, 'users', user.uid, 'trades') as CollectionReference<Trade>;
                const queries: any[] = [orderBy('date', 'asc')];
                if (selectedAccountId !== 'all') {
                    queries.unshift(where('accountId', '==', selectedAccountId));
                }
                
                const q = query(tradesCollection, ...queries);
                
                const querySnapshot = await getDocs(q);
                const fetchedTrades = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, date: (doc.data().date as unknown as Timestamp).toDate() })) as Trade[];
                setTrades(fetchedTrades);

            } catch (error: any) {
                 if (error.code === 'failed-precondition') {
                    // This error is handled globally in the dashboard, but we can show a specific message here too.
                    toast({
                        variant: 'destructive',
                        title: 'Firebase Index Required',
                        description: 'Please create the required Firestore index to filter by account.',
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

            {isLoading ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
                    <Skeleton className="h-[420px]" />
                    <Skeleton className="h-[420px]" />
                    <Skeleton className="h-[250px]" />
                    <Skeleton className="h-[250px]" />
                 </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <DrawdownAnalysis trades={trades} />
                    <RiskDistribution trades={trades} />
                    <RiskAdjustedReturns trades={trades} />
                    <AIRiskInsights trades={trades} />
                </div>
            )}
        </div>
    );
}
