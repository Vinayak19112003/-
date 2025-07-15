
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const ChecklistItem = ({ id, label, note }: { id: string; label: string; note?: string }) => (
  <div className="flex items-start space-x-3">
    <Checkbox id={id} disabled className="mt-1" />
    <div className="grid gap-1.5 leading-none">
      <Label htmlFor={id} className="text-base font-normal">
        {label}
      </Label>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  </div>
);

const Section = ({ title, items, description }: { title: string; items: { id: string; label: string; note?: string }[], description?: string }) => (
    <div className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold text-primary font-headline">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="space-y-4 pl-2">
        {items.map(item => <ChecklistItem key={item.id} {...item} />)}
        </div>
    </div>
);


export default function TradingModelPage() {
    const weekPreparationItems = [
        { id: "cot", label: "Cot & Seasonals" },
        { id: "news", label: "News" },
        { id: "weekly-profile", label: "Possible Weekly Profile" },
    ];
    
    const dailyPreparationItems = [
        { id: "pa-favorable", label: "Is PA favorable?", note: "Avoid consolidations & overexpansions" },
        { id: "dol", label: "Determine DOL" },
        { id: "olhc", label: "Determine most likely daily OLHC" },
    ];

    const triggerItems = [
        { id: "narrative", label: "Narrative" },
        { id: "poi", label: "Establish a POI on H1" },
        { id: "session-profiles", label: "Combine with session profiles" },
    ];

    const executionItems = [
        { id: "killzone", label: "Killzone" },
        { id: "entry-model", label: "Entry Model: LTF confirmation / Retracement entry" },
    ];

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Trading Model</h1>
        <Card>
            <CardHeader>
                <CardTitle>Trading Checklist Example</CardTitle>
                <CardDescription>
                    A structured guide for your trading preparation and execution based on your model.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <Section title="Week Preparation" items={weekPreparationItems} />
                <Separator />
                <Section title="Daily Preparation" items={dailyPreparationItems} />
                <Separator />
                <Section title="Trigger" description="(Short Term Trade Execution on H1)" items={triggerItems} />
                <Separator />
                <Section title="LTF Execution" description="(Intraday Execution)" items={executionItems} />
            </CardContent>
        </Card>
    </div>
  );
}
