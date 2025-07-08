
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

type ImportTradesProps = {
  onImport: (trades: Trade[]) => Promise<void>;
};

// Create a schema for import that makes most fields optional and uses string coercion
const ImportTradeSchema = TradeSchema.omit({id: true}).partial().extend({
    date: z.coerce.date({ invalid_type_error: "Invalid date format." }),
    asset: z.string().nonempty(),
    strategy: z.string().nonempty(),
    direction: z.enum(["Buy", "Sell"]),
    entryTime: z.string().nonempty(),
    entryPrice: z.coerce.number(),
    sl: z.coerce.number(),
    exitPrice: z.coerce.number(),
    result: z.enum(["Win", "Loss", "BE", "Missed"]),
});

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
          // Map CSV headers to Trade schema fields
          const mappedRow = {
            date: row.Date,
            entryTime: row['Entry Time'],
            asset: row.Asset,
            strategy: row.Strategy,
            direction: row.Direction,
            result: row.Result,
            entryPrice: row['Entry Price'],
            sl: row['Stop Loss'],
            exitPrice: row['Exit Price'],
            rr: row['R/R'] === 'N/A' ? undefined : row['R/R'],
            pnl: row['PNL ($)'] === 'N/A' ? undefined : row['PNL ($)'],
            accountSize: row['Account Size ($)'] === 'N/A' ? undefined : row['Account Size ($)'],
            riskPercentage: row['Risk (%)'] === 'N/A' ? undefined : row['Risk (%)'],
            confidence: row.Confidence,
            rulesFollowed: row['Rules Followed'] ? row['Rules Followed'].split(';').map((s: string) => s.trim()).filter(Boolean) : [],
            mistakes: row.Mistakes ? row.Mistakes.split(';').map((s: string) => s.trim()).filter(Boolean) : [],
            notes: row.Notes,
            screenshotURL: row['Screenshot URL'],
          };

          const validationResult = ImportTradeSchema.safeParse(mappedRow);

          if (validationResult.success) {
            const fullTradeData: Trade = {
                id: crypto.randomUUID(),
                ...TradeSchema.partial().parse(validationResult.data)
            };
             // Re-validate with the strict schema to fill in defaults
            const finalValidation = TradeSchema.safeParse(fullTradeData);
            if (finalValidation.success) {
                validTrades.push(finalValidation.data);
            } else {
                validationErrors.push(`Row ${index + 2}: ${finalValidation.error.issues.map(i => i.message).join(', ')}`);
            }
          } else {
            validationErrors.push(`Row ${index + 2}: ${validationResult.error.issues.map(i => i.message).join(', ')}`);
          }
        });

        if (validationErrors.length > 0) {
            toast({
                variant: "destructive",
                title: `Found ${validationErrors.length} invalid rows`,
                description: `Could not import all trades. Please check your file. Error: ${validationErrors[0]}`,
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
            description: `Successfully imported ${validTrades.length} trades.`,
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
            Upload a CSV file to bulk import trades. Make sure the columns match the export format.
            Required columns: Date, Entry Time, Asset, Strategy, Direction, Result, Entry Price, Stop Loss, Exit Price.
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
