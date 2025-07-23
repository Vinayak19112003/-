
'use client';

import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, CollectionReference, where, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useTrades } from "@/contexts/trades-context";
import { useAccountContext } from "@/contexts/account-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, LineChart, Package, Settings, Users } from 'lucide-react';
import DashboardPage from "@/app/(authed)/dashboard/page";
import JournalPage from "@/app/(authed)/journal/page";
import AnalyticsPage from "@/app/(authed)/analytics/page";
import PerformancePage from "@/app/(authed)/performance/page";
import SettingsPage from "@/app/(authed)/settings/page";

const NAV_TABS = [
    { value: 'dashboard', label: 'Dashboard', icon: Home, component: DashboardPage },
    { value: 'journal', label: 'Journal', icon: Package, component: JournalPage },
    { value: 'analytics', label: 'Analytics', icon: LineChart, component: AnalyticsPage },
    { value: 'performance', label: 'Performance', icon: Users, component: PerformancePage },
    { value: 'settings', label: 'Settings', icon: Settings, component: SettingsPage },
];

const TabSkeleton = () => (
    <div className="space-y-6 mt-4">
        <Skeleton className="h-10 w-full sm:w-[470px] self-end" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[250px]" />
            <Skeleton className="h-[250px]" />
        </div>
         <Skeleton className="h-[400px]" />
    </div>
);


export default function MainLayout() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { refreshKey } = useTrades();
    const { selectedAccountId } = useAccountContext();
    
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'dashboard';

    const [activeTab, setActiveTab] = useState(tabFromUrl);

    useEffect(() => {
        setActiveTab(tabFromUrl);
    }, [tabFromUrl]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set("tab", value);
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`);
    };

    // Effect to fetch all trades for performance analysis
    useEffect(() => {
        const fetchAllTrades = async () => {
            if (!user || !selectedAccountId) {
                setTrades([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const tradesCollection = collection(db, 'users', user.uid, 'trades') as CollectionReference<Trade>;
                
                const q = query(tradesCollection, where('accountId', '==', selectedAccountId), orderBy('date', 'asc'));
                
                const querySnapshot = await getDocs(q);
                const fetchedTrades = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, date: (doc.data().date as unknown as Timestamp).toDate() })) as Trade[];
                setTrades(fetchedTrades);

            } catch (error: any) {
                 if (error.code === 'failed-precondition') {
                    console.error("Firebase Index Required:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Firebase Index Required',
                        description: 'Please create the required Firestore index by clicking the link in the console error.',
                        duration: 10000,
                    });
                } else {
                    console.error("Error fetching trades for performance analysis:", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not fetch trade data for performance analysis."
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (user && selectedAccountId) {
            fetchAllTrades();
        }
    }, [user, toast, refreshKey, selectedAccountId]);

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight font-headline capitalize">{activeTab}</h1>
                <TabsList className="hidden sm:flex">
                    {NAV_TABS.map(tab => (
                        <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                           <tab.icon className="h-4 w-4" />
                           {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            
            {NAV_TABS.map(tab => (
                 <TabsContent key={tab.value} value={tab.value} className="mt-4">
                    {isLoading ? <TabSkeleton /> : <tab.component trades={trades} />}
                 </TabsContent>
            ))}
        </Tabs>
    );
}

