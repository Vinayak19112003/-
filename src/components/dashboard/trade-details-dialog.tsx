
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Trade } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StreamerModeText } from "@/components/streamer-mode-text";
import Image from 'next/image';

type TradeDetailsDialogProps = {
  trade: Trade | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const DetailItem = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
  <div className="flex flex-col gap-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={cn("text-base font-semibold", className)}>{value}</p>
  </div>
);

const ResultBadge = ({ result }: { result: Trade["result"] }) => {
    const variant = {
      Win: "success",
      Loss: "destructive",
      BE: "secondary",
      Missed: "secondary"
    }[result] as "success" | "destructive" | "secondary";
    return <Badge variant={variant} className="text-sm px-3 py-1">{result}</Badge>;
};


export function TradeDetailsDialog({ trade, isOpen, onOpenChange }: TradeDetailsDialogProps) {
  if (!trade) return null;
  const returnPercentage = trade.accountSize && trade.accountSize > 0 && trade.pnl != null ? (trade.pnl / trade.accountSize) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trade Details: {trade.asset}</DialogTitle>
          <DialogDescription>
            A complete overview of your trade on {format(trade.date, "PPP")} at {trade.entryTime}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-6">
                 <DetailItem label="Result" value={<ResultBadge result={trade.result} />} />
                 <DetailItem label="Strategy" value={trade.strategy} />
                 <DetailItem label="Direction" value={trade.direction} className={cn(trade.direction === 'Buy' ? 'text-success' : 'text-destructive')} />

                 <DetailItem label="Entry Price" value={trade.entryPrice} />
                 <DetailItem label="Stop Loss" value={trade.sl} />
                 <DetailItem label="Exit Price" value={trade.exitPrice} />
                 
                 <DetailItem label="R/R Ratio" value={trade.rr?.toFixed(2) ?? 'N/A'} />
                 <DetailItem label="Confidence" value={`${trade.confidence}/10`} />

                 <DetailItem 
                    label="PNL ($)"
                    value={
                        <StreamerModeText className={cn(trade.pnl != null && trade.pnl > 0 ? 'text-success' : trade.pnl != null && trade.pnl < 0 ? 'text-destructive' : '')}>
                            {trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : 'N/A'}
                        </StreamerModeText>
                    }
                 />

                <DetailItem 
                    label="Return %"
                    value={
                        <StreamerModeText className={cn(returnPercentage > 0 ? 'text-success' : returnPercentage < 0 ? 'text-destructive' : '')}>
                            {trade.accountSize && trade.accountSize > 0 ? `${returnPercentage.toFixed(2)}%` : 'N/A'}
                        </StreamerModeText>
                    }
                />

                <DetailItem 
                    label="Risk %"
                    value={
                        <StreamerModeText>
                            {trade.riskPercentage ? `${trade.riskPercentage}%` : 'N/A'}
                        </StreamerModeText>
                    }
                />

                 <DetailItem 
                    label="Account Size"
                    value={
                        <StreamerModeText>
                            {trade.accountSize ? `$${trade.accountSize.toLocaleString()}` : 'N/A'}
                        </StreamerModeText>
                    }
                 />
            </div>
            <div className="md:col-span-1 space-y-4">
                {trade.screenshotURL && (
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Screenshot</p>
                        <div className="relative aspect-video rounded-md overflow-hidden border">
                            <Image src={trade.screenshotURL} alt="Trade screenshot" layout="fill" objectFit="cover" />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {trade.mistakes && trade.mistakes.length > 0 && (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Mistakes Made</p>
                <div className="flex flex-wrap gap-2">
                    {trade.mistakes.map(mistake => (
                        <Badge key={mistake} variant="outline">{mistake}</Badge>
                    ))}
                </div>
            </div>
        )}

        {trade.notes && (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Notes</p>
                <div className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{trade.notes}</div>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
