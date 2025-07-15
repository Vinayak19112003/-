
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTradingModel, type ModelSection } from '@/hooks/use-trading-model';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from "lucide-react";

const ChecklistSection = ({ title, items, description }: { title: string; items: string[]; description?: string }) => {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-lg font-semibold text-primary font-headline">{title}</h3>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <ul className="space-y-2 pl-2">
                {items.map(item => (
                    <li key={item} className="flex items-start gap-3">
                        <div className="flex h-6 items-center">
                           <Check className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-base">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default function DisciplinePage() {
    const { model, isLoaded } = useTradingModel();

    if (!isLoaded) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-64" />
                        <Skeleton className="h-4 w-full max-w-md" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight font-headline">Discipline Checklist</h1>
            <Card>
                <CardHeader>
                    <CardTitle>My Trading Model</CardTitle>
                    <CardDescription>
                        A read-only view of your defined trading model. To edit, go to the Trading Model page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <ChecklistSection 
                        title="Week Preparation" 
                        items={model.week}
                    />
                    <ChecklistSection 
                        title="Daily Preparation"
                        items={model.day}
                    />
                    <ChecklistSection 
                        title="Trigger"
                        description="(Short Term Trade Execution on H1)"
                        items={model.trigger}
                    />
                    <ChecklistSection 
                        title="LTF Execution"
                        description="(Intraday Execution)"
                        items={model.ltf}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
