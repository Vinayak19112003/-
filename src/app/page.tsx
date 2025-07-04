
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, LogOut, Settings, Sun, Moon, Video } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { startOfMonth, isSameDay } from "date-fns";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { StrategyAnalytics } from "@/components/dashboard/strategy-analytics";
import { MistakeAnalysis } from "@/components/dashboard/mistake-analysis";
import { ExportTrades } from "@/components/dashboard/export-trades";
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar";
import { useToast } from "@/hooks/use-toast";
import { useStrategies } from "@/hooks/use-strategies";
import { useTradingRules } from "@/hooks/use-trading-rules";
import AuthGuard from "@/components/auth/auth-guard";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { PerformanceRadarChart } from "@/components/dashboard/performance-radar-chart";
import { SharePerformance } from "@/components/dashboard/share-performance";
import { useStreamerMode } from "@/contexts/streamer-mode-context";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RuleAdherenceAnalysis } from "@/components/dashboard/rule-adherence-analysis";
import { TimeAnalysis } from "@/components/dashboard/time-analysis";

function Dashboard() {
  const { trades, addTrade, updateTrade, deleteTrade, isLoaded } = useTrades();
  const { strategies, addStrategy, deleteStrategy } = useStrategies();
  const { tradingRules, addTradingRule, deleteTradingRule } = useTradingRules();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isStreamerMode, toggleStreamerMode } = useStreamerMode();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

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


  const handleOpenForm = (trade?: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTrade(undefined);
    setIsFormOpen(false);
  };
  
  const handleSaveTrade = async (trade: Trade) => {
    try {
      if (editingTrade) {
        await updateTrade(trade);
      } else {
        await addTrade(trade);
      }
      handleCloseForm();
    } catch (error) {
      console.error("Error saving trade from page level:", error);
      throw error;
    }
  };

  const handleDeleteTrade = async (id: string) => {
    await deleteTrade(id);
    toast({
      title: "Trade Deleted",
      description: "The trade has been removed from your log.",
    });
  };

  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;
  const FormHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const FormTitleComponent = isMobile ? SheetTitle : DialogTitle;
  const FormDescriptionComponent = isMobile ? SheetDescription : DialogDescription;
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !isLoaded) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <Skeleton className="h-8 w-48" />
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-10" />
            </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <Skeleton className="h-8 w-36" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-[160px]" />
                    <Skeleton className="h-10 w-[300px]" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:gap-8">
              <Skeleton className="h-[600px]" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <Skeleton className="h-[260px]" />
                <Skeleton className="h-[260px]" />
                <Skeleton className="h-[260px]" />
                <Skeleton className="h-[260px]" />
              </div>
              <Skeleton className="h-[380px]" />
              <Skeleton className="h-[420px]" />
            </div>
            <div>
                <Skeleton className="h-[400px]" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
            <SharePerformance trades={filteredTrades} tradingRules={tradingRules} />
            <PatternAnalysis trades={filteredTrades} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <div className="flex items-center justify-between w-full">
                    <Label htmlFor="streamer-mode" className="flex items-center gap-2 cursor-pointer font-normal">
                      <Video className="h-4 w-4" />
                      <span>Streamer Mode</span>
                    </Label>
                    <Switch
                      id="streamer-mode"
                      checked={isStreamerMode}
                      onCheckedChange={toggleStreamerMode}
                    />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="relative h-4 w-4">
                        <Sun className="absolute h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                    <span className="ml-2">Theme</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        System
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
       </header>
       <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight font-headline">Dashboard</h2>
            <div className="flex items-center gap-2">
                <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
                <Button className="gap-1" onClick={() => handleOpenForm()}>
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Trade
                    </span>
                </Button>
            </div>
        </div>
        
        <StatsCards trades={filteredTrades} />
        
        <div className="grid grid-cols-1 gap-4 md:gap-8">
            <MonthlyCalendar trades={trades} onDateSelect={handleCalendarDateSelect} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <RuleAdherenceAnalysis trades={filteredTrades} tradingRules={tradingRules} />
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>
                            A radar view of your key performance indicators.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <PerformanceRadarChart trades={filteredTrades} tradingRules={tradingRules} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Mistake Analysis</CardTitle>
                        <CardDescription>
                            Breakdown of your most common trading errors.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <MistakeAnalysis trades={filteredTrades} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Strategy Analytics</CardTitle>
                        <CardDescription>
                            Performance breakdown by trading strategy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[260px]">
                        <StrategyAnalytics trades={filteredTrades} />
                    </CardContent>
                </Card>
            </div>

            <TimeAnalysis trades={filteredTrades} />
            
            <EquityCurveChart trades={filteredTrades} />
        </div>

        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="grid gap-2 flex-1">
                    <CardTitle>Trade Log</CardTitle>
                    <CardDescription>Your filtered history of trades.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <ExportTrades trades={filteredTrades}/>
                </div>
            </CardHeader>
            <CardContent>
               <TradeTable trades={filteredTrades} onEdit={handleOpenForm} onDelete={handleDeleteTrade}/>
            </CardContent>
        </Card>

       </main>
       <footer className="py-8 text-center text-sm text-muted-foreground">
        <div className="container">
            <p>Created by Anony Trading</p>
        </div>
       </footer>
       
        <FormComponent open={isFormOpen} onOpenChange={setIsFormOpen}>
            <FormContentComponent className={cn(isMobile ? "w-full" : "max-w-4xl")}>
                <FormHeaderComponent>
                <FormTitleComponent>{editingTrade ? "Edit Trade" : "Add New Trade"}</FormTitleComponent>
                <FormDescriptionComponent>
                    Fill in the details of your trade. Accurate records lead to better insights.
                </FormDescriptionComponent>
                </FormHeaderComponent>
                <div className={cn("p-4 overflow-y-auto max-h-[80vh]")}>
                    <TradeForm 
                      trade={editingTrade} 
                      onSave={handleSaveTrade} 
                      setOpen={setIsFormOpen}
                      strategies={strategies}
                      addStrategy={addStrategy}
                      deleteStrategy={deleteStrategy}
                      tradingRules={tradingRules}
                      addTradingRule={addTradingRule}
                      deleteTradingRule={deleteTradingRule}
                    />
                </div>
            </FormContentComponent>
        </FormComponent>
    </div>
  );
}


export default function HomePage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}
