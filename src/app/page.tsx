
"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, ClipboardCopy, LogOut, Share2, Settings, Sun, Moon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { startOfMonth, isSameDay } from "date-fns";
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DateRangeFilter } from "@/components/dashboard/date-range-filter";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { StrategyAnalytics } from "@/components/dashboard/strategy-analytics";
import { MistakeAnalysis } from "@/components/dashboard/mistake-analysis";
import { ExportTrades } from "@/components/dashboard/export-trades";
import { MonthlyCalendar } from "@/components/dashboard/monthly-calendar";
import { useToast } from "@/hooks/use-toast";
import { useStrategies } from "@/hooks/use-strategies";
import { Label } from "@/components/ui/label";
import AuthGuard from "@/components/auth/auth-guard";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { PerformanceRadarChart } from "@/components/dashboard/performance-radar-chart";
import { SharePerformance } from "@/components/dashboard/share-performance";


function Dashboard() {
  const { trades, addTrade, updateTrade, deleteTrade, isLoaded } = useTrades();
  const { strategies, addStrategy, deleteStrategy } = useStrategies();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const router = useRouter();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: "The wallet address has been copied.",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy address to clipboard.",
      });
    });
  };

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
      // The form's catch block handles user-facing toasts.
      // We re-throw the error so the form is aware of the failure.
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

  const DonationComponent = isMobile ? Sheet : Dialog;
  const DonationContentComponent = isMobile ? SheetContent : DialogContent;
  const DonationHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const DonationTitleComponent = isMobile ? SheetTitle : DialogTitle;
  const DonationDescriptionComponent = isMobile ? SheetDescription : DialogDescription;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!isLoaded || !mounted) {
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
            <SharePerformance trades={filteredTrades} />
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
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <div className="relative h-4 w-4">
                        <Sun className="absolute h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                    <span>Theme</span>
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
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
       </header>
       <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <DateRangeFilter date={dateRange} onDateChange={setDateRange} />
        </div>
        <StatsCards trades={filteredTrades} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="lg:col-span-2">
                <MonthlyCalendar trades={trades} onDateSelect={handleCalendarDateSelect} />
            </div>
            <div className="lg:col-span-1 space-y-4 md:space-y-8">
                <EquityCurveChart trades={filteredTrades} />
                <Card>
                    <Tabs defaultValue="mistakes" className="w-full">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div className="grid gap-1">
                                    <CardTitle>Analytics</CardTitle>
                                    <CardDescription>
                                        A detailed breakdown of your performance.
                                    </CardDescription>
                                </div>
                                <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                                    <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
                                    <TabsTrigger value="performance">Metrics</TabsTrigger>
                                    <TabsTrigger value="strategy">Strategy</TabsTrigger>
                                </TabsList>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <TabsContent value="mistakes" className="mt-4">
                                <MistakeAnalysis trades={filteredTrades} />
                            </TabsContent>
                            <TabsContent value="performance" className="mt-4">
                                <PerformanceRadarChart trades={filteredTrades} />
                            </TabsContent>
                            <TabsContent value="strategy" className="mt-4">
                                <StrategyAnalytics trades={filteredTrades} />
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>
        </div>

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
               <TradeTable trades={filteredTrades} onEdit={handleOpenForm} onDelete={handleDeleteTrade}/>
            </CardContent>
        </Card>

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
                    />
                </div>
            </FormContentComponent>
        </FormComponent>

        <DonationComponent open={isDonationOpen} onOpenChange={setIsDonationOpen}>
          <DonationContentComponent className={cn(isMobile ? "w-full" : "max-w-2xl")}>
            <DonationHeaderComponent>
              <DonationTitleComponent className="flex items-center gap-2 text-xl sm:text-2xl">
                💰 Support Anony Trading
              </DonationTitleComponent>
              <DonationDescriptionComponent>
                If you find value in Anony Trading, consider supporting the project with a small crypto donation. Your support helps continue building and improving free resources for traders.
              </DonationDescriptionComponent>
            </DonationHeaderComponent>
            <div className={cn("px-4 pb-4 overflow-y-auto max-h-[80vh]")}>
              <div className="space-y-4">
                <div className="space-y-3 text-left">
                  <div>
                    <Label className="font-semibold">Bitcoin (BTC)</Label>
                    <div className="flex items-center gap-2 rounded-md border bg-muted p-2">
                      <code className="text-xs sm:text-sm break-all flex-1 font-mono">bc1pclv0jx7x6haj32k2w26js5t7su6jvgtzljqvef63l409frmhaz5qdx0hdy</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy('bc1pclv0jx7x6haj32k2w26js5t7su6jvgtzljqvef63l409frmhaz5qdx0hdy')}>
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">Ethereum / EVM (ETH, USDT ERC20, etc)</Label>
                    <div className="flex items-center gap-2 rounded-md border bg-muted p-2">
                      <code className="text-xs sm:text-sm break-all flex-1 font-mono">0xC00b329eBa0A16cCC63E650B0122027E6365f89C</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy('0xC00b329eBa0A16cCC63E650B0122027E6365f89C')}>
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold">USDT (TRC20)</Label>
                    <div className="flex items-center gap-2 rounded-md border bg-muted p-2">
                      <code className="text-xs sm:text-sm break-all flex-1 font-mono">TUNPBVYWRcqXVbCEP6guy9pdTRrhhok9YC</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy('TUNPBVYWRcqXVbCEP6guy9pdTRrhhok9YC')}>
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-center text-muted-foreground pt-2">Every contribution, big or small, means a lot. Thank you! 🙏</p>
              </div>
            </div>
          </DonationContentComponent>
        </DonationComponent>

       </main>
       <footer className="py-12 text-center text-sm text-muted-foreground">
        <div className="container flex flex-col items-center justify-center gap-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span>Created by Anony Trading</span>
                <span className="hidden sm:inline-block">|</span>
                <div className="flex items-center gap-4">
                    <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline">X</a>
                    <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline">Discord</a>
                    <button onClick={() => setIsDonationOpen(true)} className="hover:text-primary transition-colors underline">
                        Donation
                    </button>
                </div>
            </div>
        </div>
       </footer>
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
