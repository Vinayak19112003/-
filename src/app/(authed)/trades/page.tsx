
'use client';

import { useEffect, useState } from 'react';
import { useTrades } from "@/contexts/trades-context";
import { TradeTable } from "@/components/dashboard/trade-table";
import { useToast } from "@/hooks/use-toast";
import { useTradeForm } from "@/contexts/trade-form-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportTrades } from "@/components/dashboard/import-trades";
import { ExportTrades } from "@/components/dashboard/export-trades";
import { ClearAllTrades } from "@/components/dashboard/clear-all-trades";

export default function TradesPage() {
    const { 
        trades, 
        deleteTrade, 
        deleteAllTrades,
        fetchTrades,
        loadMoreTrades,
        hasMore,
        isLoading,
        isLoaded
    } = useTrades();
    const { toast } = useToast();
    const { openForm } = useTradeForm();

    useEffect(() => {
        // Initial fetch for this page
        fetchTrades({ newQuery: true });
    }, [fetchTrades]);

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

    const handleImport = async () => {
       // After import, the context automatically refetches.
       // We just need to show a toast.
       toast({
            title: "Import Successful",
            description: `Trades were imported and the log has been refreshed.`,
        });
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
                    trades={trades} 
                    onEdit={openForm} 
                    onDelete={handleDeleteTrade}
                    onLoadMore={loadMoreTrades}
                    hasMore={hasMore}
                    isLoading={isLoading}
                    isLoaded={isLoaded}
                />
            </CardContent>
        </Card>
    );
}
