
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Trade } from '@/lib/types';
import { Loader2, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TradeSchema } from '@/lib/types';

// A lenient schema to parse external CSV data.
const ExternalTradeSchema = z.object({
  opening_time: z.string().optional(),
  type: z.string().optional(),
  symbol: z.string().optional(),
  opening_p: z.string().optional(),
  closing_p: z.string().optional(),
  stop_loss: z.string().optional(),
  profit_usd: z.string().optional(),
}).partial().passthrough();


export function ImportTrades({ onImport }: ImportTradesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a CSV file to import.",
      });
      return;
    }

    setIsImporting(true);

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: async (results) => {
        const { data, errors } = results;

        if (errors.length > 0) {
            toast({
                variant: 'destructive',
                title: 'CSV Parsing Error',
                description: `Could not parse the file. Error: ${errors[0].message}`,
            });
            setIsImporting(false);
            return;
        }

        let validTrades: Trade[] = [];
        const validationErrors: string[] = [];

        data.forEach((row, index) => {
          const validationResult = ExternalTradeSchema.safeParse(row);

          if (validationResult.success) {
            const csvRow = validationResult.data;
            
            // Check for required fields from the user's CSV format
            if (!csvRow.opening_time || !csvRow.type || !csvRow.symbol || !csvRow.opening_p || !csvRow.closing_p || !csvRow.stop_loss || !csvRow.profit_usd) {
                validationErrors.push(`Row ${index + 2}: Missing one or more required columns (opening_time, type, symbol, opening_p, closing_p, stop_loss, profit_usd).`);
                return; // skip this row
            }

            try {
                const date = new Date(csvRow.opening_time);
                if (isNaN(date.getTime())) {
                    throw new Error(`Invalid date format in 'opening_time': ${csvRow.opening_time}`);
                }

                const entryPrice = parseFloat(csvRow.opening_p);
                const exitPrice = parseFloat(csvRow.closing_p);
                const sl = parseFloat(csvRow.stop_loss);
                const pnl = parseFloat(csvRow.profit_usd);

                const risk = Math.abs(entryPrice - sl);
                const reward = Math.abs(exitPrice - entryPrice);
                const rr = risk > 0 ? reward / risk : 0;
                
                const entryTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                const direction = csvRow.type.toLowerCase() === 'buy' ? 'Buy' : 'Sell';
                
                let result: "Win" | "Loss" | "BE" = "BE";
                if (pnl > 0) result = "Win";
                else if (pnl < 0) result = "Loss";

                const tradeData: Trade = {
                    id: crypto.randomUUID(),
                    date: date,
                    entryTime: entryTime,
                    asset: csvRow.symbol.replace(/m$/, '').toUpperCase(),
                    strategy: 'Imported',
                    direction: direction,
                    result: result,
                    entryPrice: entryPrice,
                    sl: sl,
                    exitPrice: exitPrice,
                    rr: rr,
                    pnl: pnl,
                    confidence: 5,
                    mistakes: [],
                    rulesFollowed: [],
                    notes: 'Imported via CSV',
                    screenshotURL: '',
                    accountSize: 0,
                    riskPercentage: 0,
                };

                const finalValidation = TradeSchema.safeParse(tradeData);

                if (finalValidation.success) {
                    validTrades.push(finalValidation.data);
                } else {
                    validationErrors.push(`Row ${index + 2}: ${finalValidation.error.issues.map(i => i.message).join(', ')}`);
                }

            } catch (e: any) {
                validationErrors.push(`Row ${index + 2}: ${e.message}`);
            }

          } else {
            validationErrors.push(`Row ${index + 2}: ${validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
          }
        });

        if (validationErrors.length > 0) {
            toast({
                variant: "destructive",
                title: `Found ${validationErrors.length} invalid rows`,
                description: `Could not import all trades. Please check your file. First error: ${validationErrors[0]}`,
                duration: 9000,
            });
             if (validTrades.length === 0) {
                setIsImporting(false);
                return;
            }
        }
        
        if (validTrades.length === 0 && validationErrors.length === 0) {
             toast({
                variant: "destructive",
                title: `No trades found`,
                description: `The file does not contain any valid trades to import.`,
            });
            setIsImporting(false);
            return;
        }

        try {
          await onImport(validTrades);
          toast({
            title: "Import Successful",
            description: `Successfully imported ${validTrades.length} trades. ${validationErrors.length > 0 ? `${validationErrors.length} rows were skipped.` : ''}`,
          });
          setIsOpen(false);
          setFile(null);
        } catch (error) {
          // Error is handled in the onImport function (useTrades hook)
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        toast({
            variant: 'destructive',
            title: 'Error reading file',
            description: error.message,
        });
        setIsImporting(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Trades from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import trades. Required columns: opening_time, type, symbol, opening_p, closing_p, stop_loss, profit_usd.
          </DialogDescription>
        </DialogHeader>
        <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isImporting ? "Importing..." : "Import Trades"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
