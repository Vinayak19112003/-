
"use client";

import { useMemo, memo } from 'react';
import type { Trade } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDay, parse } from 'date-fns';
import { Clock, Calendar, BarChart, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreamerModeText } from '../streamer-mode-text';

const DURATION_BUCKETS = [
    { label: 'Under 1h', max: 60 },
    { label: '1-4h', max: 240 },
    { label: '4-12h', max: 720 },
    { label: '>12h', max: Infinity },
];

const StatCard = ({ title, value, subValue, icon: Icon, valueClassName }: { title: string, value: string, subValue?: string, icon: React.ElementType, valueClassName?: string }) => (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn("text-lg font-bold font-headline", valueClassName)}>{value}</p>
            {subValue && <StreamerModeText as="p" className="text-xs text-muted-foreground">{subValue}</StreamerModeText>}
        </div>
    </div>
);


export const TimeStatCards = memo(function TimeStatCards({ trades }: { trades: Trade[] }) {

    const stats = useMemo(() => {
        if (trades.length === 0) {
            return {
                bestTime: 'N/A', avgPnlBestTime: 0,
                bestDay: 'N/A', avgPnlBestDay: 0,
                optimalDuration: 'N/A', avgPnlOptimalDuration: 0,
                bestSession: 'N/A', avgPnlBestSession: 0,
            }
        }
        
        // Best Trading Time (Hour)
        const hourlyStats: { [hour: number]: { pnl: number; count: number } } = {};
        trades.forEach(trade => {
            if (trade.entryTime) {
                const hour = parseInt(trade.entryTime.split(':')[0], 10);
                if (!hourlyStats[hour]) hourlyStats[hour] = { pnl: 0, count: 0 };
                hourlyStats[hour].pnl += trade.pnl || 0;
                hourlyStats[hour].count++;
            }
        });

        let bestTime = 'N/A';
        let avgPnlBestTime = 0;
        if(Object.keys(hourlyStats).length > 0) {
            const bestHourData = Object.entries(hourlyStats).reduce((best, current) => (current[1].pnl > best[1].pnl ? current : best));
            const bestHour = parseInt(bestHourData[0], 10);
            bestTime = `${bestHour}:00 - ${bestHour + 1}:00`;
            avgPnlBestTime = bestHourData[1].pnl / bestHourData[1].count;
        }

        // Best Day of Week
        const dailyStats: { [day: number]: { pnl: number, count: number } } = {};
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        trades.forEach(trade => {
            const dayIndex = getDay(trade.date);
            if (!dailyStats[dayIndex]) dailyStats[dayIndex] = { pnl: 0, count: 0 };
            dailyStats[dayIndex].pnl += trade.pnl || 0;
            dailyStats[dayIndex].count++;
        });
        
        let bestDay = 'N/A';
        let avgPnlBestDay = 0;
        if (Object.keys(dailyStats).length > 0) {
            const bestDayData = Object.entries(dailyStats).reduce((best, current) => (current[1].pnl > best[1].pnl ? current : best));
            bestDay = daysOfWeek[parseInt(bestDayData[0], 10)];
            avgPnlBestDay = bestDayData[1].pnl / bestDayData[1].count;
        }
        
        // Optimal Duration
        const durationStats: { [label: string]: { pnl: number, count: number } } = DURATION_BUCKETS.reduce((acc, bucket) => ({...acc, [bucket.label]: {pnl: 0, count: 0}}), {});
        trades.forEach(trade => {
             if (trade.entryTime && trade.exitTime) {
                const entry = parse(`${trade.date.toISOString().split('T')[0]} ${trade.entryTime}`, 'yyyy-MM-dd HH:mm', new Date());
                const exit = parse(`${trade.date.toISOString().split('T')[0]} ${trade.exitTime}`, 'yyyy-MM-dd HH:mm', new Date());
                 if (!isNaN(entry.getTime()) && !isNaN(exit.getTime())) {
                    if (exit < entry) exit.setDate(exit.getDate() + 1);
                    const durationMinutes = (exit.getTime() - entry.getTime()) / (1000 * 60);
                    const bucket = DURATION_BUCKETS.find(b => durationMinutes < b.max);
                    if (bucket) {
                        durationStats[bucket.label].pnl += trade.pnl || 0;
                        durationStats[bucket.label].count++;
                    }
                }
             }
        });
        let optimalDuration = 'N/A';
        let avgPnlOptimalDuration = 0;
        if(Object.values(durationStats).some(s => s.count > 0)) {
            const bestDurationData = Object.entries(durationStats).reduce((best, current) => (current[1].pnl > best[1].pnl ? current : best));
            optimalDuration = bestDurationData[0];
            avgPnlOptimalDuration = bestDurationData[1].pnl / bestDurationData[1].count;
        }

        // Best Session
        const sessionStats: { [session: string]: { pnl: number, count: number } } = {};
        trades.forEach(trade => {
            if (trade.session) {
                if(!sessionStats[trade.session]) sessionStats[trade.session] = {pnl: 0, count: 0};
                sessionStats[trade.session].pnl += trade.pnl || 0;
                sessionStats[trade.session].count++;
            }
        });

        let bestSession = 'N/A';
        let avgPnlBestSession = 0;
        if (Object.keys(sessionStats).length > 0) {
            const bestSessionData = Object.entries(sessionStats).reduce((best, current) => (current[1].pnl > best[1].pnl ? current : best));
            bestSession = bestSessionData[0];
            avgPnlBestSession = bestSessionData[1].pnl / bestSessionData[1].count;
        }
        
        return { bestTime, avgPnlBestTime, bestDay, avgPnlBestDay, optimalDuration, avgPnlOptimalDuration, bestSession, avgPnlBestSession };
    }, [trades]);


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Best Trading Time" 
                value={stats.bestTime} 
                subValue={`Avg: $${stats.avgPnlBestTime.toFixed(2)}`}
                icon={Clock}
                valueClassName={stats.avgPnlBestTime > 0 ? 'text-success' : 'text-destructive'}
            />
            <StatCard 
                title="Best Day" 
                value={stats.bestDay} 
                subValue={`Avg: $${stats.avgPnlBestDay.toFixed(2)}`}
                icon={Calendar} 
                valueClassName={stats.avgPnlBestDay > 0 ? 'text-success' : 'text-destructive'}
            />
            <StatCard 
                title="Optimal Duration" 
                value={stats.optimalDuration} 
                subValue={`Avg: $${stats.avgPnlOptimalDuration.toFixed(2)}`}
                icon={BarChart} 
                valueClassName={stats.avgPnlOptimalDuration > 0 ? 'text-success' : 'text-destructive'}
            />
            <StatCard 
                title="Best Session" 
                value={stats.bestSession} 
                subValue={`Avg: $${stats.avgPnlBestSession.toFixed(2)}`}
                icon={Trophy} 
                valueClassName={stats.avgPnlBestSession > 0 ? 'text-success' : 'text-destructive'}
            />
        </div>
    );
});
