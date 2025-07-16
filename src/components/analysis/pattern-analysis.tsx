
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Trade } from '@/lib/types';
import { Loader2, Wand2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PatternAnalysis({ trades }: { trades: Trade[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setIsOpen(true);
    
    // Compile a comprehensive string of all psychological data
    const tradeNotes = trades.map(t => {
      let entry = `Trade Date: ${t.date.toLocaleDateString()}\nResult: ${t.result}, PNL: ${t.pnl?.toFixed(2) ?? 'N/A'}\n`;
      if (t.preTradeEmotion) entry += `Pre-Trade Emotion: ${t.preTradeEmotion}\n`;
      if (t.postTradeEmotion) entry += `Post-Trade Emotion: ${t.postTradeEmotion}\n`;
      if (t.marketContext) entry += `Market Context: ${t.marketContext}\n`;
      if (t.entryReason) entry += `Entry Reason: ${t.entryReason}\n`;
      if (t.tradeFeelings) entry += `Feelings During Trade: ${t.tradeFeelings}\n`;
      if (t.lossAnalysis) entry += `Loss Analysis: ${t.lossAnalysis}\n`;
      if (t.notes) entry += `General Notes: ${t.notes}\n`;
      return entry;
    }).join('\n\n---\n\n');
      
    if (!tradeNotes.trim()) {
      setAnalysis('You have no journal entries to analyze. Add some notes or psychological data to your trades to use this feature.');
      setIsLoading(false);
      return;
    }
    
    try {
      const { patternDetection } = await import('@/ai/flows/pattern-detection');
      const result = await patternDetection({ tradeNotes });
      setAnalysis(result.patterns);
    } catch (error) {
      console.error("AI analysis failed:", error);
      setAnalysis("An error occurred while analyzing your trades. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleAnalyze} variant="outline" disabled={isLoading}>
        {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <Wand2 className="mr-2 h-4 w-4" />
        )}
        AI Analysis
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary"/>
                Trade Pattern Analysis
            </DialogTitle>
            <DialogDescription>
              AI-powered psychological and behavioral insights from your journal.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 w-full rounded-md border p-4">
              {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{analysis}</p>
              )}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
