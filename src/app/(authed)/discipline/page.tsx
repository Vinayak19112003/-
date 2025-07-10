
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import * as React from 'react';

const HabitTracker = dynamic(() => import('@/components/discipline/habit-tracker').then(mod => mod.HabitTracker), {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
});

const DisciplinePageContent = React.memo(function DisciplinePageContent() {
    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Discipline Tracker</h1>
                <p className="text-muted-foreground">
                    Build and track the daily habits that lead to consistent performance.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Today's Checklist</CardTitle>
                    <CardDescription>
                        Check off your habits for today. Your progress is saved automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <HabitTracker />
                </CardContent>
            </Card>
        </div>
    )
});

export default function DisciplinePage() {
    return <DisciplinePageContent />;
}
