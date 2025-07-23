
"use client";

/**
 * @fileoverview This file defines the Performance page.
 * This page provides a deep dive into risk analytics and performance metrics,
 * focusing on drawdown, risk-adjusted returns, and overall consistency.
 */

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";
import { useTradingRules } from "@/hooks/use-trading-rules";

// Dynamically import tab content
const RiskAnalysisTab = dynamic(() => import('@/components/performance/risk-analysis-tab'), { ssr: false, loading: () => <TabSkeleton /> });
const PsychologyTab = dynamic(() => import('@/components/performance/psychology-tab'), { ssr: false, loading: () => <TabSkeleton /> });
const TimeAnalysisTab = dynamic(() => import('@/components/performance/time-analysis-tab'), { ssr: false, loading: () => <TabSkeleton /> });

const TabSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4">
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[250px]" />
        <Skeleton className="h-[250px]" />
    </div>
)

interface PerformancePageProps {
  trades: Trade[];
}

/**
 * The main component for the Performance page.
 * It handles fetching all trade data and passing it to the risk analysis components.
 */
export default function PerformancePage({ trades }: PerformancePageProps) {
    const { tradingRules } = useTradingRules();
    
    // The component now receives all trades as a prop, so no internal fetching is needed.

    return (
        <div className="space-y-4 md:space-y-6">
            <PsychologyTab trades={trades} tradingRules={tradingRules} />
            <RiskAnalysisTab trades={trades} />
            <TimeAnalysisTab trades={trades} />
        </div>
    );
}
