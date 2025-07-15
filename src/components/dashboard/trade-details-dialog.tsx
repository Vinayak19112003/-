
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
import { Separator } from "../ui/separator";

type TradeDetailsDialogProps = {
  trade: Trade | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const DetailItem = ({ label, value, className, isBlock = false }: { label: string; value: React.ReactNode; className?: string, isBlock?: boolean }) => (
    <div className={cn("flex flex-col gap-1", isBlock && "col-span-full")}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={cn("text-base font-semibold", className)}>{value}</div>
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

const NoteBlock = ({ label, value }: { label: string, value: string | undefined | null }) => {
    if (!value) return null;
    return (
        <div className="space-y-2 col-span-full">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap border">{value}</div>
        </div>
    )
}

export function TradeDetailsDialog({ trade, isOpen, onOpenChange }: TradeDetailsDialogProps) {
  if (!trade) return null;
  const returnPercentage = trade.accountSize && trade.accountSize > 0 && trade.pnl != null ? (trade.pnl / trade.accountSize) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Trade Details: {trade.asset}</DialogTitle>
          <DialogDescription>
            A complete overview of your trade on {format(trade.date, "PPP")} at {trade.entryTime}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
                
                <Separator className="col-span-full my-2" />

                <h4 className="col-span-full text-base font-semibold font-headline">Trade Context</h4>
                <DetailItem label="Session" value={trade.session || 'N/A'} />
                <DetailItem label="Entry Time Frame" value={trade.entryTimeFrame || 'N/A'} />
                <DetailItem label="Key Level" value={trade.keyLevel || 'N/A'} />

                <Separator className="col-span-full my-2" />
                
                <h4 className="col-span-full text-base font-semibold font-headline">Psychological Analysis</h4>

                 <DetailItem label="Pre-Trade Emotion" value={trade.preTradeEmotion || 'N/A'} />
                 <DetailItem label="Post-Trade Emotion" value={trade.postTradeEmotion || 'N/A'} />
                 
                <NoteBlock label="Market Context" value={trade.marketContext} />
                <NoteBlock label="Primary Entry Reason" value={trade.entryReason} />
                <NoteBlock label="Feelings During Trade" value={trade.tradeFeelings} />
                <NoteBlock label="Loss Analysis" value={trade.lossAnalysis} />

            </div>
            <div className="md:col-span-1 space-y-4">
                {trade.screenshotURL && (
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Screenshot</p>
                        <a href={trade.screenshotURL} target="_blank" rel="noopener noreferrer" className="block relative aspect-video rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all">
                            <Image 
                                src={trade.screenshotURL} 
                                alt="Trade screenshot" 
                                fill
                                style={{objectFit: 'cover'}}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </a>
                    </div>
                )}
                
                {trade.rulesFollowed && trade.rulesFollowed.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Rules Followed</p>
                        <div className="flex flex-wrap gap-2">
                            {trade.rulesFollowed.map(rule => (
                                <Badge key={rule} variant="secondary">{rule}</Badge>
                            ))}
                        </div>
                    </div>
                )}

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
                    <NoteBlock label="General Notes" value={trade.notes} />
                )}
            </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
