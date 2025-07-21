
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";

// Dynamically import charting components
const DailyPerformance = dynamic(() => import('@/components/analysis/daily-performance').then(mod => mod.DailyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const MonthlyPerformance = dynamic(() => import('@/components/analysis/monthly-performance').then(mod => mod.MonthlyPerformance), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const SessionAnalysis = dynamic(() => import('@/components/analysis/session-analysis'), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const DurationAnalysis = dynamic(() => import('@/components/analysis/duration-analysis').then(mod => mod.DurationAnalysis), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });
const TimeAnalysis = dynamic(() => import('@/components/analysis/time-analysis').then(mod => mod.TimeAnalysis), { ssr: false, loading: () => <Skeleton className="h-[400px]" /> });

export default function TimeAnalysisTab({ trades }: { trades: Trade[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <DailyPerformance trades={trades} />
            <MonthlyPerformance trades={trades} />
            <div className="lg:col-span-2">
                 <SessionAnalysis trades={trades} />
            </div>
            <div className="lg:col-span-2">
                <TimeAnalysis trades={trades} />
            </div>
             <div className="lg:col-span-2">
                <DurationAnalysis trades={trades} />
            </div>
        </div>
    );
}
