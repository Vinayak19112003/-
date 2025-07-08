
"use client";

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from 'lucide-react';

type ClearAllTradesProps = {
  onClear: () => Promise<void>;
  disabled: boolean;
};

export function ClearAllTrades({ onClear, disabled }: ClearAllTradesProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    await onClear();
    setIsClearing(false);
    setIsDialogOpen(false);
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={disabled || isClearing}>
          {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Clear All
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all trades from your log.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClear}
            disabled={isClearing}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, delete all trades
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
