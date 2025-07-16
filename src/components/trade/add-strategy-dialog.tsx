
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

type AddStrategyDialogProps = {
  strategies: string[];
  addStrategy: (newStrategy: string) => Promise<boolean>;
  deleteStrategy: (strategy: string) => Promise<void>;
};

export function AddStrategyDialog({ strategies, addStrategy, deleteStrategy }: AddStrategyDialogProps) {
  const [open, setOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    const trimmedStrategy = newStrategy.trim();
    if (!trimmedStrategy) {
        toast({
            variant: "destructive",
            title: "Invalid Strategy Name",
            description: "Strategy name cannot be empty.",
        });
        return;
    }

    setIsLoading(true);
    const success = await addStrategy(trimmedStrategy);
    if (success) {
      setNewStrategy("");
    }
    setIsLoading(false);
  };

  const handleDelete = async (strategy: string) => {
    setIsLoading(true);
    await deleteStrategy(strategy);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add or manage strategies</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Strategies</DialogTitle>
          <DialogDescription>
            Add and view your tracked strategies.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <h4 className="font-medium text-sm">Existing Strategies</h4>
            <ScrollArea className="h-40 w-full rounded-md border p-2">
                {strategies.length > 0 ? (
                    strategies.map(strategy => (
                        <div key={strategy} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <span className="text-sm font-medium">{strategy}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(strategy)} disabled={isLoading}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete {strategy}</span>
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No custom strategies yet.</p>
                )}
            </ScrollArea>
        </div>
        <div className="grid gap-2">
            <h4 className="font-medium text-sm">Add New Strategy</h4>
            <div className="flex w-full items-center space-x-2">
                <Input
                  id="strategy-name"
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  placeholder="e.g. London Killzone"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdd();
                    }
                  }}
                />
                <Button onClick={handleAdd} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Strategy
                </Button>
            </div>
        </div>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
