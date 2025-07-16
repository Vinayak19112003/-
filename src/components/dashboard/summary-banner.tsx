
"use client";

import { useMemo } from 'react';
import { type Trade } from '@/lib/types';
import { isThisMonth, isToday, startOfMonth } from 'date-fns';
import { TrendingUp, TrendingDown, Target, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StreamerModeText } from '@/components/streamer-mode-text';
import { useTargets } from '@/hooks/use-targets';
import { Progress } from '@/components/ui/progress';
import { SetTargetsDialog } from './set-targets-dialog';

type SummaryBannerProps = {
  trades: Trade[];
};

export function SummaryBanner({ trades }: SummaryBannerProps) {
  const { targets } = useTargets();

  const monthStats = useMemo(() => {
    const thisMonthsTrades = trades.filter(trade => isThisMonth(new Date(trade.date)));
    if (thisMonthsTrades.length === 0) {
      return { pnl: 0, topMistake: null };
    }

    const pnl = thisMonthsTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const mistakeCounts: { [key: string]: number } = {};
    thisMonthsTrades.forEach(trade => {
      trade.mistakes?.forEach(mistake => {
        mistakeCounts[mistake] = (mistakeCounts[mistake] || 0) + 1;
      });
    });
    
    const topMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return { pnl, topMistake };
  }, [trades]);

  const pnlProgress = targets.profit > 0 ? (monthStats.pnl / targets.profit) * 100 : 0;
  const lossProgress = targets.loss > 0 ? (Math.abs(monthStats.pnl < 0 ? monthStats.pnl : 0) / targets.loss) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border bg-card text-card-foreground p-3 shadow-sm">
      <div className="flex flex-col justify-between gap-2">
          <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                  <p className="text-xs text-muted-foreground">Monthly Profit Target</p>
                  <StreamerModeText as="p" className="text-base font-bold font-headline text-success">
                      {`$${monthStats.pnl.toFixed(2)} / $${targets.profit.toFixed(2)}`}
                  </StreamerModeText>
              </div>
          </div>
          <Progress value={pnlProgress} indicatorClassName="bg-success" />
      </div>

      <div className="flex flex-col justify-between gap-2">
          <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                  <p className="text-xs text-muted-foreground">Max Loss Limit</p>
                   <StreamerModeText as="p" className="text-base font-bold font-headline text-destructive">
                      {`$${Math.abs(monthStats.pnl < 0 ? monthStats.pnl : 0).toFixed(2)} / $${targets.loss.toFixed(2)}`}
                  </StreamerModeText>
              </div>
          </div>
          <Progress value={lossProgress} indicatorClassName="bg-destructive"/>
      </div>

      <div className="flex flex-col justify-between gap-2">
          <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                  <p className="text-xs text-muted-foreground">This Month's Top Mistake</p>
                  <p className="text-base font-semibold truncate">{monthStats.topMistake || 'None'}</p>
              </div>
          </div>
          <SetTargetsDialog>
             <button className="w-full text-center text-xs text-primary underline-offset-4 hover:underline">
                Set Targets
             </button>
          </SetTargetsDialog>
      </div>
    </div>
  );
}
