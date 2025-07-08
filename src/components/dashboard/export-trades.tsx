
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Loader2 } from 'lucide-react';
import type { Trade } from '@/lib/types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ExportTradesProps = {
  trades: Trade[];
};

export function ExportTrades({ trades }: ExportTradesProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    const dataToExport = trades.map(t => ({
      Date: t.date.toISOString().split('T')[0],
      'Entry Time': t.entryTime,
      Asset: t.asset,
      Strategy: t.strategy,
      Direction: t.direction,
      Result: t.result,
      'Entry Price': t.entryPrice,
      'Stop Loss': t.sl,
      'Exit Price': t.exitPrice,
      'R/R': t.rr?.toFixed(2) ?? 'N/A',
      'PNL ($)': t.pnl?.toFixed(2) ?? 'N/A',
      'Account Size ($)': t.accountSize ?? 'N/A',
      'Risk (%)': t.riskPercentage ?? 'N/A',
      Confidence: t.confidence,
      'Rules Followed': t.rulesFollowed?.join('; ') ?? '',
      Mistakes: t.mistakes?.join('; ') ?? '',
      Notes: t.notes ?? '',
      'Screenshot URL': t.screenshotURL ?? '',
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tradevision_journal_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const exportToPDF = () => {
    setIsExporting(true);
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.text("Trade Log Export", 14, 15);

    const head = [[
        'Date', 'Asset', 'Strategy', 'Direction', 'Result', 
        'Entry Price', 'SL', 'Exit Price', 'R/R', 'PNL ($)', 
        'Confidence', 'Mistakes', 'Notes'
    ]];

    const body = trades.map(t => [
        t.date.toISOString().split('T')[0],
        t.asset,
        t.strategy,
        t.direction,
        t.result,
        t.entryPrice.toString(),
        t.sl.toString(),
        t.exitPrice.toString(),
        t.rr?.toFixed(2) ?? 'N/A',
        t.pnl?.toFixed(2) ?? 'N/A',
        t.confidence.toString(),
        t.mistakes?.join('; ') ?? '',
        t.notes ?? ''
    ]);

    autoTable(doc, {
        head: head,
        body: body,
        startY: 20,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: [41, 128, 185], fontSize: 8, fontStyle: 'bold' },
        columnStyles: {
            2: { cellWidth: 30 }, // Strategy
            12: { cellWidth: 50 }, // Notes
        }
    });

    doc.save('tradevision_journal_export.pdf');
    setIsExporting(false);
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem onClick={exportToCSV} disabled={trades.length === 0}>
                Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} disabled={trades.length === 0}>
                Export as PDF
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  );
}
