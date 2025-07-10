
'use client';

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
import { PlusCircle, Loader2, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

type ManageHabitsDialogProps = {
  habits: string[];
  addHabit: (newHabit: string) => Promise<boolean>;
  deleteHabit: (habit: string) => Promise<void>;
};

export function ManageHabitsDialog({ habits, addHabit, deleteHabit }: ManageHabitsDialogProps) {
  const [open, setOpen] = useState(false);
  const [newHabit, setNewHabit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    const trimmedHabit = newHabit.trim();
    if (!trimmedHabit) {
        toast({
            variant: "destructive",
            title: "Invalid Habit",
            description: "Habit cannot be empty.",
        });
        return;
    }

    setIsLoading(true);
    const success = await addHabit(trimmedHabit);
    if (success) {
      setNewHabit("");
    }
    setIsLoading(false);
  };
  
  const handleDelete = async (habit: string) => {
    setIsLoading(true);
    await deleteHabit(habit);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Manage Habits
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Daily Habits</DialogTitle>
          <DialogDescription>
            Add or remove the habits you want to track daily.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <h4 className="font-medium text-sm">Your Habits</h4>
            <ScrollArea className="h-40 w-full rounded-md border p-2">
                {habits.length > 0 ? (
                    habits.map(habit => (
                        <div key={habit} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <span className="text-sm font-medium">{habit}</span>
                             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(habit)} disabled={isLoading}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete {habit}</span>
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No habits yet.</p>
                )}
            </ScrollArea>
        </div>
        <div className="grid gap-2">
            <h4 className="font-medium text-sm">Add New Habit</h4>
            <div className="flex w-full items-center space-x-2">
                <Input
                  id="habit-name"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  placeholder="e.g. Completed pre-market analysis"
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
                    Add Habit
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
