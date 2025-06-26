
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
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AddAssetDialogProps = {
  onAddAsset: (asset: string) => void;
};

export function AddAssetDialog({ onAddAsset }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [newAsset, setNewAsset] = useState("");
  const { toast } = useToast();

  const handleAdd = () => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    if (trimmedAsset) {
      onAddAsset(trimmedAsset);
      toast({
        title: "Asset Added",
        description: `"${trimmedAsset}" has been added to your asset list.`,
      });
      setNewAsset("");
      setOpen(false);
    } else {
        toast({
            variant: "destructive",
            title: "Invalid Asset Name",
            description: "Asset name cannot be empty.",
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add new asset</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Enter the symbol for the new asset you want to track.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="asset-name" className="text-right">
              Symbol
            </Label>
            <Input
              id="asset-name"
              value={newAsset}
              onChange={(e) => setNewAsset(e.target.value)}
              className="col-span-3"
              placeholder="e.g. SPX500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleAdd}>Add Asset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
