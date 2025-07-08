
'use client';

import { useTrades } from "@/hooks/use-trades";
import { TradeTable } from "@/components/dashboard/trade-table";
import { useToast } from "@/hooks/use-toast";
import { useTradeForm } from "@/contexts/trade-form-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportTrades } from "@/components/dashboard/import-trades";
import { ExportTrades } from "@/components/dashboard/export-trades";
import { ClearAllTrades } from "@/components/dashboard/clear-all-trades";

export default function TradesPage() {
    const { trades, deleteTrade, addMultipleTrades, deleteAllTrades } = useTrades();
    const { toast } = useToast();
    const { openForm } = useTradeForm();

    const handleDeleteTrade = async (id: string) => {
        await deleteTrade(id);
        toast({
            title: "Trade Deleted",
            description: "The trade has been removed from your log.",
        });
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="grid gap-2 flex-1">
                    <CardTitle>Trade Log</CardTitle>
                    <CardDescription>Your complete history of trades.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   <ImportTrades onImport={addMultipleTrades} />
                   <ExportTrades trades={trades}/>
                   <ClearAllTrades onClear={deleteAllTrades} disabled={trades.length === 0} />
                </div>
            </CardHeader>
            <CardContent>
               <TradeTable trades={trades} onEdit={openForm} onDelete={handleDeleteTrade}/>
            </CardContent>
        </Card>
    );
}
