
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
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

type AddMistakeTagDialogProps = {
  mistakeTags: string[];
  addMistakeTag: (newTag: string) => boolean;
};

export function AddMistakeTagDialog({ mistakeTags, addMistakeTag }: AddMistakeTagDialogProps) {
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) {
        toast({
            variant: "destructive",
            title: "Invalid Tag Name",
            description: "Mistake tag cannot be empty.",
        });
        return;
    }

    setIsLoading(true);
    const success = addMistakeTag(trimmedTag);
    if (success) {
      toast({
        title: "Mistake Tag Added",
        description: `"${trimmedTag}" has been added to your list.`,
      });
      setNewTag("");
    } else {
        toast({
            variant: "destructive",
            title: "Tag Exists",
            description: "This mistake tag is already in your list.",
        });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add or manage mistake tags</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Mistake Tags</DialogTitle>
          <DialogDescription>
            Add and view your custom mistake tags.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <h4 className="font-medium text-sm">Existing Tags</h4>
            <ScrollArea className="h-40 w-full rounded-md border p-2">
                {mistakeTags.length > 0 ? (
                    mistakeTags.map(tag => (
                        <div key={tag} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <span className="text-sm font-medium">{tag}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No custom tags yet.</p>
                )}
            </ScrollArea>
        </div>
        <div className="grid gap-2">
            <h4 className="font-medium text-sm">Add New Tag</h4>
            <div className="flex w-full items-center space-x-2">
                <Input
                  id="tag-name"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g. Chasing Price"
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
                    Add Tag
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
