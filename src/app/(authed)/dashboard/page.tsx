
"use client";

/**
 * @fileoverview This file defines the main Dashboard page.
 * It serves as the primary landing page for authenticated users, displaying
 * a high-level overview of their trading performance. It includes a summary
 * banner, key performance indicator (KPI) cards, a monthly calendar view,
 * and an equity curve chart.
 */

import { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay, isSameDay, subMonths } from "date-fns";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import type { Trade } from "@/lib/types";

// Dynamically import components to improve initial page load performance.
const SummaryBanner = dynamic(() => import('@/components/dashboard/summary-banner').then(mod => mod.SummaryBanner), { ssr: false, loading: () => <Skeleton className="h-28" /> });
const EquityCurveChart = dynamic(() => import('@/components/dashboard/equity-curve-chart').then(mod => mod.EquityCurveChart), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const MonthlyCalendar = dynamic(() => import('@/components/dashboard/monthly-calendar'), { ssr: false, loading: () => <Skeleton className="h-[600px]" /> });

interface DashboardPageProps {
  trades: Trade[];
}

/**
 * The main component for the Dashboard page.
 * It manages fetching and filtering trade data to pass to its child components.
 */
export default function DashboardPage({ trades: allTrades }: DashboardPageProps) {
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  
  // Default to showing last 3 months of data for a better initial view.
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfDay(new Date()),
  });

  useEffect(() => {
    if (dateRange?.from && allTrades) {
        const from = dateRange.from;
        const to = endOfDay(dateRange.to ?? dateRange.from);
        const newFilteredTrades = allTrades.filter(trade => {
            const tradeDate = new Date(trade.date);
            return tradeDate >= from && tradeDate <= to;
        });
        setFilteredTrades(newFilteredTrades);
    } else {
        setFilteredTrades(allTrades || []);
    }
  }, [dateRange, allTrades]);


  /**
   * Handles date selection from the MonthlyCalendar component.
   * Sets the date range filter to the single selected day.
   * If the day is already selected, it resets the filter.
   * @param {Date} date - The date selected on the calendar.
   */
  const handleCalendarDateSelect = (date: Date) => {
    const from = dateRange?.from;
    const to = dateRange?.to;
    // If the selected date is already the only date in the range, reset to default view
    if (from && to && isSameDay(date, from) && isSameDay(date, to)) {
        setDateRange({ 
            from: startOfMonth(subMonths(new Date(), 2)), 
            to: endOfDay(new Date()) 
        });
    } else {
        setDateRange({ from: date, to: date });
    }
  };
  
  // Memoize the trades needed for the summary banner (last month).
  const summaryTrades = useMemo(() => {
      const startOfThisMonth = startOfMonth(new Date());
      return (allTrades || []).filter(trade => new Date(trade.date) >= startOfThisMonth);
  }, [allTrades]);


  // Renders the main dashboard layout.
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
      </div>
      
      <SummaryBanner trades={summaryTrades} />
      <StatsCards trades={filteredTrades} />
      
      <div className="grid grid-cols-1 gap-4 md:gap-6">
          <MonthlyCalendar trades={allTrades} onDateSelect={handleCalendarDateSelect} />
          <EquityCurveChart trades={filteredTrades} />
      </div>
    </div>
  );
}
