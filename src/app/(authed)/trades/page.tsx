
'use client';

import { useMemo, useState } from 'react';
import { useTrades } from "@/contexts/trades-context";
import { TradeTable } from "@/components/dashboard/trade-table";
import { useToast } from "@/hooks/use-toast";
import { useTradeForm } from "@/contexts/trade-form-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ImportTrades } from "@/components/dashboard/import-trades";
import { ExportTrades } from "@/components/dashboard/export-trades";
import { ClearAllTrades } from "@/components/dashboard/clear-all-trades";
import { Skeleton } from '@/components/ui/skeleton';

const TRADES_PER_PAGE = 20;

export default function TradesPage() {
    const { 
        trades, 
        deleteTrade, 
        deleteAllTrades,
        refetchTrades,
        isLoaded
    } = useTrades();
    const { toast } = useToast();
    const { openForm } = useTradeForm();
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedTrades = useMemo(() => {
        const startIndex = (currentPage - 1) * TRADES_PER_PAGE;
        const endIndex = startIndex + TRADES_PER_PAGE;
        return trades.slice(startIndex, endIndex);
    }, [trades, currentPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(trades.length / TRADES_PER_PAGE);
    }, [trades]);

    const handleDeleteTrade = async (id: string) => {
        const success = await deleteTrade(id);
        if (success) {
            toast({
                title: "Trade Deleted",
                description: "The trade has been removed from your log.",
            });
        }
    };
    
    const handleClearAll = async () => {
        const success = await deleteAllTrades();
        if (success) {
            toast({
                title: "All Trades Deleted",
                description: "Your trade log has been cleared.",
            });
        }
    }

    const handleImport = async (addedCount: number, skippedCount: number) => {
       // The context handles adding the trades to the local state, so no refetch is needed.
       toast({
            title: "Import Complete",
            description: `${addedCount} trades were imported. ${skippedCount} duplicates were skipped.`,
        });
    }

    if (!isLoaded) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-36" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="grid gap-2 flex-1">
                    <CardTitle>Trade Log</CardTitle>
                    <CardDescription>Your complete history of trades.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <ImportTrades onImport={handleImport} />
                   <ExportTrades trades={trades}/>
                   <ClearAllTrades onClear={handleClearAll} disabled={trades.length === 0} />
                </div>
            </CardHeader>
            <CardContent>
               <TradeTable 
                    trades={paginatedTrades} 
                    onEdit={openForm} 
                    onDelete={handleDeleteTrade}
                />
                {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-4 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
