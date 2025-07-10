
'use client';

import { HabitTracker } from "@/components/discipline/habit-tracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


export default function DisciplinePage() {
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
}
