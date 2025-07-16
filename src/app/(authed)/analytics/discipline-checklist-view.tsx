
'use client';

/**
 * @fileoverview This file defines the Discipline Checklist page.
 * It displays the user's defined trading model in a simple, read-only checklist format.
 * This serves as a quick reference for the user to review their trading rules and procedures.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTradingModel } from '@/hooks/use-trading-model';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from "lucide-react";

/**
 * A component that renders a section of the checklist.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the checklist section.
 * @param {string[]} props.items - An array of checklist items to display.
 * @param {string} [props.description] - An optional description for the section.
 */
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

/**
 * The main component for the Discipline page.
 * It fetches the user's trading model and displays it using ChecklistSection components.
 */
export default function DisciplineChecklistView() {
    const { model, isLoaded } = useTradingModel();

    // Renders a skeleton loader while the trading model data is being fetched.
    if (!isLoaded) {
        return (
            <div className="space-y-6">
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
            <Card>
                <CardHeader>
                    <CardTitle>Discipline Checklist</CardTitle>
                    <CardDescription>
                        A read-only view of your defined trading model to reinforce your process.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Render each section of the trading model */}
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
