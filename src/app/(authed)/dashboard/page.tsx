
"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from 'next/dynamic';
import { useTrades } from "@/hooks/use-trades";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { startOfMonth, isSameDay } from "date-fns";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";

const EquityCurveChart = dynamic(() => import('@/components/dashboard/equity-curve-chart').then(mod => mod.EquityCurveChart), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const MonthlyCalendar = dynamic(() => import('@/components/dashboard/monthly-calendar').then(mod => mod.MonthlyCalendar), { ssr: false, loading: () => <Skeleton className="h-[600px]" /> });


export default function DashboardPage() {
  const { trades, isLoaded } = useTrades();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const handleCalendarDateSelect = (date: Date) => {
    if (dateRange?.from && isSameDay(date, dateRange.from) && dateRange.to && isSameDay(date, dateRange.to)) {
        setDateRange({ from: startOfMonth(new Date()), to: new Date() });
    } else {
        setDateRange({ from: date, to: date });
    }
  };

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h1>
          <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
      </div>
      
      <StatsCards trades={filteredTrades} />
      
      <div className="grid grid-cols-1 gap-4 md:gap-8">
          <EquityCurveChart trades={filteredTrades} />
          <MonthlyCalendar trades={trades} onDateSelect={handleCalendarDateSelect} />
      </div>
    </>
  );
}
