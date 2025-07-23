
'use client';

/**
 * @fileoverview This file defines the Trade Log page.
 * It displays a paginated table of all the user's trades. It includes
 * functionality for editing, deleting, importing, exporting, and clearing trades.
 * It uses infinite scrolling ("Load More" button) to fetch trades in batches
 * for better performance.
 */

import * as React from 'react';
import { useTrades } from "@/contexts/trades-context";
import { useToast } from "@/hooks/use-toast";
import { useTradeForm } from "@/contexts/trade-form-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import type { Trade } from '@/lib/types';
import { useAccountContext } from '@/contexts/account-context';

// Dynamically import child components to optimize initial load.
const TradeTable = dynamic(() => import('@/components/journal/trade-table'), {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full" />
});
const ImportTrades = dynamic(() => import('@/components/journal/import-trades'), { ssr: false });
const ExportTrades = dynamic(() => import('@/components/journal/export-trades').then(mod => mod.ExportTrades), { ssr: false });
const ClearAllTrades = dynamic(() => import('@/components/journal/clear-all-trades').then(mod => mod.ClearAllTrades), { ssr: false });

interface JournalPageProps {
  trades: Trade[];
}

/**
 * The main content component for the Trades page.
 * It is memoized to prevent re-renders unless its props change.
 */
export default function JournalPage({ trades }: JournalPageProps) {
    const { deleteTrade, deleteAllTrades, addMultipleTrades } = useTrades();
    const { toast } = useToast();
    const { openForm } = useTradeForm();
    const { selectedAccountId } = useAccountContext();
    
    /**
     * Handles the deletion of a single trade.
     * @param {string} id - The ID of the trade to delete.
     */
    const handleDeleteTrade = async (id: string) => {
        const success = await deleteTrade(id);
        if (success) {
            toast({ title: "Trade Deleted", description: "The trade has been removed from your log." });
        }
    };
    
    /**
     * Handles clearing all trades from the user's log.
     */
    const handleClearAll = async () => {
        if (!selectedAccountId) {
            toast({ variant: 'destructive', title: 'Error', description: 'No account selected to clear.' });
            return;
        }
        const success = await deleteAllTrades(selectedAccountId);
        if (success) {
            toast({ title: "All Trades Deleted", description: "Your trade log has been cleared." });
        }
    }

    /**
     * Callback for when the AI import is complete.
     * @param {number} addedCount - The number of trades successfully added.
     * @param {number} skippedCount - The number of duplicate trades skipped.
     */
    const handleImport = async (addedCount: number, skippedCount: number) => {
       toast({
            title: "Import Complete",
            description: `${addedCount} trades were imported. ${skippedCount} duplicates were skipped.`,
        });
    }

    const reversedTrades = React.useMemo(() => [...trades].reverse(), [trades]);

    // Renders the main content of the trade log page.
    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="grid gap-2 flex-1">
                    <CardTitle>Trade Journal</CardTitle>
                    <CardDescription>Your complete history of trades.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <ImportTrades onImport={handleImport} addMultipleTrades={addMultipleTrades} />
                   <ExportTrades trades={reversedTrades}/>
                   <ClearAllTrades onClear={handleClearAll} disabled={reversedTrades.length === 0} />
                </div>
            </CardHeader>
            <CardContent>
               <TradeTable 
                    trades={reversedTrades} 
                    onEdit={openForm} 
                    onDelete={handleDeleteTrade}
                />
            </CardContent>
        </Card>
    );
}
