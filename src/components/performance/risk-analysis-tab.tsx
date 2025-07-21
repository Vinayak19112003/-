
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";

// Dynamically import charting components
const DrawdownAnalysis = dynamic(() => import('@/components/performance/drawdown-analysis').then(mod => mod.DrawdownAnalysis), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const RiskAdjustedReturns = dynamic(() => import('@/components/performance/risk-adjusted-returns').then(mod => mod.RiskAdjustedReturns), { ssr: false, loading: () => <Skeleton className="h-[250px]" /> });
const RiskDistribution = dynamic(() => import('@/components/performance/risk-distribution').then(mod => mod.RiskDistribution), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const AIRiskInsights = dynamic(() => import('@/components/performance/ai-risk-insights').then(mod => mod.AIRiskInsights), { ssr: false, loading: () => <Skeleton className="h-[250px]" /> });

export default function RiskAnalysisTab({ trades }: { trades: Trade[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <DrawdownAnalysis trades={trades} />
            <RiskDistribution trades={trades} />
            <RiskAdjustedReturns trades={trades} />
            <AIRiskInsights trades={trades} />
        </div>
    );
}
