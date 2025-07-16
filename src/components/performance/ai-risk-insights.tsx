
"use client";

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Trade } from "@/lib/types";
import { BrainCircuit } from 'lucide-react';

type AIRiskInsightsProps = {
  trades: Trade[];
};

export const AIRiskInsights = memo(function AIRiskInsights({ trades }: AIRiskInsightsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    AI Risk Insights
                </CardTitle>
                 <CardDescription>
                    AI-powered analysis of your risk management.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="h-full w-full border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground p-4 text-center">
                    <p>AI Risk Insights Coming Soon</p>
                </div>
            </CardContent>
        </Card>
    );
});
