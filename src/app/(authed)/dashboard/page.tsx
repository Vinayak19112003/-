
"use client";

/**
 * @fileoverview This file defines the main Dashboard page.
 * It serves as the primary landing page for authenticated users, displaying
 * a high-level overview of their trading performance. It includes a summary
 * banner, key performance indicator (KPI) cards, a monthly calendar view,
 * and an equity curve chart.
 */

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "react-day-picker";
import { startOfMonth, endOfDay, isSameDay } from "date-fns";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import type { Trade } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useTrades } from "@/contexts/trades-context";

// Dynamically import components to improve initial page load performance.
const SummaryBanner = dynamic(() => import('@/components/dashboard/summary-banner').then(mod => mod.SummaryBanner), { ssr: false, loading: () => <Skeleton className="h-28" /> });
const EquityCurveChart = dynamic(() => import('@/components/dashboard/equity-curve-chart').then(mod => mod.EquityCurveChart), { ssr: false, loading: () => <Skeleton className="h-[420px]" /> });
const MonthlyCalendar = dynamic(() => import('@/components/dashboard/monthly-calendar'), { ssr: false, loading: () => <Skeleton className="h-[600px]" /> });

/**
 * The main component for the Dashboard page.
 * It manages fetching and filtering trade data to pass to its child components.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshKey } = useTrades(); // A key that changes to trigger data refetches.
  
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Effect to fetch ALL trades once. This is used for components that need the
  // full trade history, like the SummaryBanner and MonthlyCalendar.
  useEffect(() => {
    const fetchAllTrades = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const tradesCollection = collection(db, 'users', user.uid, 'trades');
            const q = query(tradesCollection, orderBy('date', 'asc'));
            const querySnapshot = await getDocs(q);
            const fetchedTrades = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id, date: doc.data().date.toDate()})) as Trade[];
            setAllTrades(fetchedTrades);
        } catch (error) {
            console.error("Error fetching all trades for dashboard:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch summary trade data." });
        } finally {
            setIsLoading(false);
        }
    };
    fetchAllTrades();
  }, [user, toast, refreshKey]);
  
  // Effect to filter the `allTrades` array based on the selected date range.
  // This runs whenever the date range or the list of all trades changes.
  useEffect(() => {
    const fetchFilteredTrades = () => {
        if (!dateRange?.from || !dateRange?.to) {
            setFilteredTrades(allTrades); // "All time" is selected
            return;
        }
        const toDate = endOfDay(dateRange.to);
        const filtered = allTrades.filter(trade => 
            new Date(trade.date) >= dateRange.from! && new Date(trade.date) <= toDate
        );
        setFilteredTrades(filtered);
    };

    if (!isLoading) {
        fetchFilteredTrades();
    }
  }, [dateRange, allTrades, isLoading]);


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
        setDateRange({ from: startOfMonth(new Date()), to: new Date() });
    } else {
        setDateRange({ from: date, to: date });
    }
  };

  // Renders a skeleton loading state while fetching initial data.
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-10 w-full sm:w-[470px]" />
        </div>
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-8">
            <MonthlyCalendar trades={[]} onDateSelect={()=>{}} />
            <EquityCurveChart trades={[]} />
        </div>
      </div>
    );
  }

  // Renders the main dashboard layout.
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h1>
          <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
      </div>
      
      {/* Uses all trades for historical summary */}
      <SummaryBanner trades={allTrades} />

      {/* Uses filtered trades for date-range specific stats */}
      <StatsCards trades={filteredTrades} />
      
      <div className="grid grid-cols-1 gap-4 md:gap-6">
          <MonthlyCalendar trades={allTrades} onDateSelect={handleCalendarDateSelect} />
          <EquityCurveChart trades={filteredTrades} />
      </div>
    </div>
  );
}
