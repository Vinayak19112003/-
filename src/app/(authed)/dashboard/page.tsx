
"use client";

import { useState, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useTrades } from "@/contexts/trades-context";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { startOfMonth, isWithinInterval, isSameDay } from "date-fns";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { SummaryBanner } from "@/components/dashboard/summary-banner";

const EquityCurveChart = dynamic(() => import('@/components/dashboard/equity-curve-chart').then(mod => mod.EquityCurveChart), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const MonthlyCalendar = dynamic(() => import('@/components/dashboard/monthly-calendar').then(mod => mod.MonthlyCalendar), { ssr: false, loading: () => <Skeleton className="h-[600px]" /> });


export default function DashboardPage() {
  const { trades, isLoaded } = useTrades();

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


  const handleCalendarDateSelect = (date: Date) => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    if (from && isSameDay(date, from) && to && isSameDay(date, to)) {
        setDateRange({ from: startOfMonth(new Date()), to: new Date() });
    } else {
        setDateRange({ from: date, to: date });
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-10 w-full sm:w-[470px]" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-8">
            <Skeleton className="h-[600px]" />
            <Skeleton className="h-[420px]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h1>
          <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
      </div>
      
      <SummaryBanner trades={trades} />

      <StatsCards trades={filteredTrades} />
      
      <div className="grid grid-cols-1 gap-4 md:gap-8">
          <MonthlyCalendar trades={trades} onDateSelect={handleCalendarDateSelect} />
          <EquityCurveChart trades={filteredTrades} />
      </div>
    </>
  );
}
