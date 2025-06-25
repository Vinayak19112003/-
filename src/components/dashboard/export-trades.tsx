
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
      ...t,
      date: t.date.toISOString().split('T')[0],
      mistakes: t.mistakes?.join(', '),
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'trades.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const exportToPDF = () => {
    setIsExporting(true);
    const doc = new jsPDF();
    
    doc.text("Trade Log Export", 14, 15);

    autoTable(doc, {
        head: [['Date', 'Asset', 'Strategy', 'Direction', 'RR', 'Result', 'Mistakes']],
        body: trades.map(t => [
            t.date.toISOString().split('T')[0],
            t.asset,
            t.strategy,
            t.direction,
            t.rr?.toFixed(2) ?? 'N/A',
            t.result,
            t.mistakes?.join(', ') ?? ''
        ]),
        startY: 20
    });

    doc.save('trades.pdf');
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
