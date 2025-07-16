
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
import { Loader2, Upload, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { importTrades } from '@/ai/flows/import-trades-flow';
import type { Trade } from '@/lib/types';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

type ImportTradesProps = {
  onImport: (addedCount: number, skippedCount: number) => void;
  addMultipleTrades: (newTrades: Omit<Trade, 'id'>[]) => Promise<{success: boolean, addedCount: number}>;
};

export default function ImportTrades({ onImport, addMultipleTrades }: ImportTradesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !user) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "Please select a file and ensure you are logged in.",
      });
      return;
    }

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileDataUri = e.target?.result as string;

        if (!fileDataUri) {
            toast({
                variant: 'destructive',
                title: 'File Error',
                description: 'Could not read the contents of the file.',
            });
            setIsImporting(false);
            return;
        }

        try {
            const result = await importTrades({ fileDataUri });
            const tradesFromAI = result.trades;

            if (!tradesFromAI || tradesFromAI.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'AI Parsing Failed',
                    description: 'The AI could not extract any trades from your file.',
                });
                setIsImporting(false);
                return;
            }

            // Deduplication logic against Firestore
            const newTicketIds = tradesFromAI.map(t => t.ticket).filter(Boolean);
            let existingTicketIds = new Set<string>();

            if (newTicketIds.length > 0) {
                const tradesCollection = collection(db, 'users', user.uid, 'trades');
                const q = query(tradesCollection, where('ticket', 'in', newTicketIds));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(doc => {
                    existingTicketIds.add(doc.data().ticket);
                });
            }
            
            const newTrades = tradesFromAI.filter(trade => !trade.ticket || !existingTicketIds.has(trade.ticket));
            const skippedCount = tradesFromAI.length - newTrades.length;

            if (newTrades.length > 0) {
                const { success, addedCount } = await addMultipleTrades(newTrades);
                if (success) {
                    onImport(addedCount, skippedCount);
                }
            } else {
                onImport(0, skippedCount);
            }
            
            setIsOpen(false);
            setFile(null);
        } catch (error) {
            console.error("AI import failed:", error);
            toast({
                variant: "destructive",
                title: "AI Import Error",
                description: "An error occurred while the AI was processing your file. Please try again.",
            });
        } finally {
            setIsImporting(false);
        }
    };

    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'There was an error reading the selected file.',
        });
        setIsImporting(false);
    };

    reader.readAsDataURL(file);
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
          <DialogTitle className='flex items-center gap-2'>
            <Wand2 className='h-5 w-5 text-primary' />
            AI-Powered Trade Import
            </DialogTitle>
          <DialogDescription>
            Upload a CSV, PDF, or image file and our AI will automatically parse your trades. It will skip duplicates based on Ticket/Order ID.
          </DialogDescription>
        </DialogHeader>
        <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
            <Label htmlFor="import-file">Import File</Label>
            <Input id="import-file" type="file" accept=".csv,.png,.jpg,.jpeg,.pdf" onChange={handleFileChange} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isImporting || !file}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isImporting ? "AI is Analyzing..." : "Import with AI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
