
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
import { PlusCircle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

type AddAssetDialogProps = {
  assets: string[];
  addAsset: (newAsset: string) => boolean;
  removeAsset: (assetToRemove: string) => void;
};

export function AddAssetDialog({ assets, addAsset, removeAsset }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [newAsset, setNewAsset] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [removingAsset, setRemovingAsset] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAdd = () => {
    const trimmedAsset = newAsset.trim().toUpperCase();
    if (!trimmedAsset) {
        toast({
            variant: "destructive",
            title: "Invalid Asset Name",
            description: "Asset name cannot be empty.",
        });
        return;
    }

    setIsLoading(true);
    const success = addAsset(trimmedAsset);
    if (success) {
      toast({
        title: "Asset Added",
        description: `"${trimmedAsset}" has been added to your asset list.`,
      });
      setNewAsset("");
    } else {
        toast({
            variant: "destructive",
            title: "Asset Exists",
            description: "This asset is already in your list.",
        });
    }
    setIsLoading(false);
  };

  const handleRemove = (assetToRemove: string) => {
    if (window.confirm(`Are you sure you want to remove "${assetToRemove}"? This cannot be undone.`)) {
        setRemovingAsset(assetToRemove);
        removeAsset(assetToRemove);
        toast({
            title: "Asset Removed",
            description: `"${assetToRemove}" has been removed from your list.`,
        });
        setRemovingAsset(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <PlusCircle className="h-4 w-4" />
          <span className="sr-only">Add or manage assets</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Assets</DialogTitle>
          <DialogDescription>
            Add, remove, and view your tracked assets.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <h4 className="font-medium text-sm">Existing Assets</h4>
            <ScrollArea className="h-40 w-full rounded-md border p-2">
                {assets.length > 0 ? (
                    assets.map(asset => (
                        <div key={asset} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <span className="text-sm font-medium">{asset}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(asset)} disabled={removingAsset === asset}>
                                {removingAsset === asset ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4 text-destructive" />}
                                <span className="sr-only">Remove {asset}</span>
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No custom assets yet.</p>
                )}
            </ScrollArea>
        </div>
        <div className="grid gap-2">
            <h4 className="font-medium text-sm">Add New Asset</h4>
            <div className="flex w-full items-center space-x-2">
                <Input
                  id="asset-name"
                  value={newAsset}
                  onChange={(e) => setNewAsset(e.target.value)}
                  placeholder="e.g. SPX500"
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
                    Add Asset
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
