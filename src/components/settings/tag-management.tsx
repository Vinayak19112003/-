
'use client';

import { useAssets } from "@/hooks/use-assets";
import { useMistakeTags } from "@/hooks/use-mistake-tags";
import { useStrategies } from "@/hooks/use-strategies";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type ManageableHook = 
    | ReturnType<typeof useAssets> 
    | ReturnType<typeof useStrategies> 
    | ReturnType<typeof useMistakeTags>;

const TagSection = ({ title, description, useHook, noun }: { title: string; description: string; useHook: () => ManageableHook; noun: string; }) => {
    const hook = useHook();
    const items: string[] = (hook as any)[`${noun}s`] || (hook as any).mistakeTags || [];
    const addItem = (hook as any)[`add${noun.charAt(0).toUpperCase() + noun.slice(1)}`] || (hook as any).addMistakeTag;
    const deleteItem = (hook as any)[`delete${noun.charAt(0).toUpperCase() + noun.slice(1)}`] || (hook as any).deleteMistakeTag;
    
    const [newItem, setNewItem] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAdd = async () => {
        const trimmedItem = newItem.trim();
        if (!trimmedItem) {
            toast({
                variant: 'destructive',
                title: `Invalid ${noun}`,
                description: `${noun} name cannot be empty.`,
            });
            return;
        }

        setIsLoading(true);
        const success = await addItem(trimmedItem);
        if (success) {
            setNewItem("");
        }
        setIsLoading(false);
    };

    const handleDelete = async (item: string) => {
        await deleteItem(item);
    };

    return (
        <div>
            <h3 className="text-lg font-semibold font-headline">{title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>

            <ScrollArea className="h-48 w-full rounded-md border p-2 mb-4">
                 {items.length > 0 ? (
                    items.map((item: string) => (
                        <div key={item} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                            <span className="text-sm font-medium">{item}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete {item}</span>
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center p-4">No custom {noun}s yet.</p>
                )}
            </ScrollArea>
             <div className="flex w-full items-center space-x-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={`Add new ${noun}...`}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdd();
                    }
                  }}
                />
                <Button onClick={handleAdd} disabled={isLoading} size="sm">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    Add
                </Button>
            </div>
        </div>
    );
};


export default function TagManagement() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tag Management</CardTitle>
                <CardDescription>
                    Manage all your custom tags in one place. These tags will be available in your trade logging form.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <TagSection title="Assets" description="The financial instruments you trade." useHook={useAssets} noun="asset" />
                <TagSection title="Strategies" description="Your unique trading strategies and setups." useHook={useStrategies} noun="strategy" />
                <TagSection title="Mistake Tags" description="Common mistakes you want to track." useHook={useMistakeTags} noun="mistakeTag" />
            </CardContent>
        </Card>
    );
}
