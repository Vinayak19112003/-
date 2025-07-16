
"use client";

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Trade } from "@/lib/types";
import { CircleDot } from 'lucide-react';

type RiskDistributionProps = {
  trades: Trade[];
};

export const RiskDistribution = memo(function RiskDistribution({ trades }: RiskDistributionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CircleDot className="h-5 w-5 text-primary" />
                    Risk Distribution
                </CardTitle>
                <CardDescription>
                    Distribution of initial risk per trade.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                 <div className="h-full w-full border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                    <p>Risk Distribution Chart Coming Soon</p>
                </div>
            </CardContent>
        </Card>
    );
});
