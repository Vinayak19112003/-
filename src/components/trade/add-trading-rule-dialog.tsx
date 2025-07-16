
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

type AddTradingRuleDialogProps = {
  tradingRules: string[];
  addTradingRule: (newRule: string) => Promise<boolean>;
  deleteTradingRule: (rule: string) => Promise<void>;
};

export function AddTradingRuleDialog({ tradingRules, addTradingRule, deleteTradingRule }: AddTradingRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    const trimmedRule = newRule.trim();
    if (!trimmedRule) {
        toast({
            variant: "destructive",
            title: "Invalid Rule",
            description: "Trading rule cannot be empty.",
        });
        return;
    }

    setIsLoading(true);
    const success = await addTradingRule(trimmedRule);
    if (success) {
      setNewRule("");
    }
    setIsLoading(false);
  };
  
  const handleDelete = async (rule: string) => {
    setIsLoading(true);
    await deleteTradingRule(rule);
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add or manage trading rules</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Trading Rules</DialogTitle>
          <DialogDescription>
            Add and view your custom trading rules.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <h4 className="font-medium text-sm">Existing Rules</h4>
            <ScrollArea className="h-40 w-full rounded-md border p-2">
                {tradingRules.length > 0 ? (
                    tradingRules.map(rule => (
                        <div key={rule} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <span className="text-sm font-medium">{rule}</span>
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rule)} disabled={isLoading}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete {rule}</span>
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No custom rules yet.</p>
                )}
            </ScrollArea>
        </div>
        <div className="grid gap-2">
            <h4 className="font-medium text-sm">Add New Rule</h4>
            <div className="flex w-full items-center space-x-2">
                <Input
                  id="rule-name"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="e.g. Waited for liquidity sweep"
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
                    Add Rule
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
