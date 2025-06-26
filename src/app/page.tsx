"use client";

import { useState, useMemo } from "react";
import { PlusCircle } from "lucide-react";
import { useTrades } from "@/hooks/use-trades";
import { type Trade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TradeForm } from "@/components/dashboard/trade-form";
import { TradeTable } from "@/components/dashboard/trade-table";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PatternAnalysis } from "@/components/dashboard/pattern-analysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { subDays, startOfMonth, isSameDay } from "date-fns";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { StrategyAnalytics } from "@/components/dashboard/strategy-analytics";
import { MistakeAnalysis } from "@/components/dashboard/mistake-analysis";
import { ExportTrades } from "@/components/dashboard/export-trades";
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar";


export default function Home() {
  const { trades, addTrade, updateTrade, deleteTrade, isLoaded } = useTrades();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const isMobile = useIsMobile();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const handleCalendarDateSelect = (date: Date) => {
    // If the same single day is clicked again, reset the filter to the default (this month)
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
        // Set to start of day
        fromDate.setHours(0, 0, 0, 0);

        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            // Set to end of day
            toDate.setHours(23, 59, 59, 999);
            return tradeDate >= fromDate && tradeDate <= toDate;
        }
        return tradeDate >= fromDate;
    });
  }, [trades, dateRange]);


  const handleOpenForm = (trade?: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTrade(undefined);
    setIsFormOpen(false);
  };
  
  const handleSaveTrade = (trade: Trade) => {
    if (editingTrade) {
      updateTrade(trade);
    } else {
      addTrade(trade);
    }
    handleCloseForm();
  };

  const handleDeleteTrade = (tradeId: string) => {
    if (window.confirm("Are you sure you want to delete this trade?")) {
      deleteTrade(tradeId);
    }
  };
  
  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;
  const FormHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const FormTitleComponent = isMobile ? SheetTitle : DialogTitle;
  const FormDescriptionComponent = isMobile ? SheetDescription : DialogDescription;

  if (!isLoaded) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
            <PatternAnalysis trades={filteredTrades} />
            <ModeToggle />
        </div>
       </header>
       <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
        </div>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <StatsCards trades={filteredTrades} />
                <MonthlyCalendar trades={trades} onDateSelect={handleCalendarDateSelect} />
                <EquityCurveChart trades={filteredTrades} />
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>Trade Log</CardTitle>
                            <CardDescription>Your filtered history of trades.</CardDescription>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                           <ExportTrades trades={filteredTrades}/>
                           <Button size="sm" className="gap-1" onClick={() => handleOpenForm()}>
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Add Trade
                                </span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <TradeTable trades={filteredTrades} onEdit={handleOpenForm} onDelete={handleDeleteTrade} />
                    </CardContent>
                </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                 <StrategyAnalytics trades={filteredTrades} />
                 <MistakeAnalysis trades={filteredTrades} />
            </div>
        </div>

        <FormComponent open={isFormOpen} onOpenChange={setIsFormOpen}>
            <FormContentComponent className={cn(isMobile ? "w-full" : "max-w-4xl")}>
                <FormHeaderComponent>
                <FormTitleComponent>{editingTrade ? "Edit Trade" : "Add New Trade"}</FormTitleComponent>
                <FormDescriptionComponent>
                    Fill in the details of your trade. Accurate records lead to better insights.
                </FormDescriptionComponent>
                </FormHeaderComponent>
                <div className={cn("p-4 overflow-y-auto max-h-[80vh]")}>
                    <TradeForm trade={editingTrade} onSave={handleSaveTrade} setOpen={setIsFormOpen}/>
                </div>
            </FormContentComponent>
        </FormComponent>

       </main>
    </div>
  );
}
