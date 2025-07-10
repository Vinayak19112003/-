
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTrades } from "@/contexts/trades-context";
import { useToast } from "@/hooks/use-toast";
import { useTradeForm } from "@/contexts/trade-form-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { Trade } from '@/lib/types';

const TRADES_PER_PAGE = 20;

const TradeTable = dynamic(() => import('@/components/dashboard/trade-table'), {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full" />
});

const ImportTrades = dynamic(() => import('@/components/dashboard/import-trades'), { ssr: false });
const ExportTrades = dynamic(() => import('@/components/dashboard/export-trades').then(mod => mod.ExportTrades), { ssr: false });
const ClearAllTrades = dynamic(() => import('@/components/dashboard/clear-all-trades').then(mod => mod.ClearAllTrades), { ssr: false });

const TradesPageContent = React.memo(function TradesPageContent() {
    const { user } = useAuth();
    const { deleteTrade, deleteAllTrades, addMultipleTrades, refreshKey } = useTrades();
    const { toast } = useToast();
    const { openForm } = useTradeForm();
    
    const [localTrades, setLocalTrades] = useState<Trade[]>([]);
    const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchTrades = React.useCallback(async (initial = false) => {
        if (!user) {
            if (initial) setIsLoading(false);
            return;
        }

        if (initial) {
            setIsLoading(true);
            setLocalTrades([]);
            setLastVisible(null);
            setHasMore(true);
        } else {
            if (!hasMore || isLoadingMore) return;
            setIsLoadingMore(true);
        }

        try {
            const tradesCollection = collection(db, 'users', user.uid, 'trades');
            let q;
            const currentLastVisible = initial ? null : lastVisible;

            if (!currentLastVisible) {
                q = query(tradesCollection, orderBy('date', 'desc'), limit(TRADES_PER_PAGE));
            } else {
                q = query(tradesCollection, orderBy('date', 'desc'), startAfter(currentLastVisible), limit(TRADES_PER_PAGE));
            }

            const documentSnapshots = await getDocs(q);

            const newTrades = documentSnapshots.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                date: doc.data().date.toDate()
            })) as Trade[];

            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setLocalTrades(prev => initial ? newTrades : [...prev, ...newTrades]);
            
            if (documentSnapshots.docs.length < TRADES_PER_PAGE) {
                setHasMore(false);
            }

        } catch (error) {
            console.error("Error fetching trades:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch trades.' });
        } finally {
            if (initial) setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [user, hasMore, isLoadingMore, lastVisible, toast]);

    useEffect(() => {
        if (user) {
            fetchTrades(true);
        }
    }, [user, fetchTrades, refreshKey]);

    const handleDeleteTrade = async (id: string) => {
        const success = await deleteTrade(id);
        if (success) {
            setLocalTrades(prev => prev.filter(t => t.id !== id));
            toast({ title: "Trade Deleted", description: "The trade has been removed from your log." });
        }
    };
    
    const handleClearAll = async () => {
        const success = await deleteAllTrades();
        if (success) {
            setLocalTrades([]);
            setLastVisible(null);
            setHasMore(false);
            toast({ title: "All Trades Deleted", description: "Your trade log has been cleared." });
        }
    }

    const handleImport = async (addedCount: number, skippedCount: number) => {
       toast({
            title: "Import Complete",
            description: `${addedCount} trades were imported. ${skippedCount} duplicates were skipped.`,
        });
        fetchTrades(true); // Refetch to show new trades
    }

    if (isLoading) {
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
                   <ImportTrades onImport={handleImport} addMultipleTrades={addMultipleTrades} />
                   <ExportTrades trades={localTrades}/>
                   <ClearAllTrades onClear={handleClearAll} disabled={localTrades.length === 0} />
                </div>
            </CardHeader>
            <CardContent>
               <TradeTable 
                    trades={localTrades} 
                    onEdit={openForm} 
                    onDelete={handleDeleteTrade}
                />
                 {isLoadingMore && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                {hasMore && !isLoadingMore && (
                    <div className="flex justify-center pt-4">
                        <Button onClick={() => fetchTrades(false)}>Load More</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});


export default function TradesPage() {
    return <TradesPageContent />;
}
