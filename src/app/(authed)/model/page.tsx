
'use client';

/**
 * @fileoverview This file defines the Trading Model page.
 * This page allows users to create, edit, reorder, and delete items in their
 * personal trading checklist. The checklist is divided into multiple sections
 * (e.g., Week Preparation, Daily Preparation). The state is managed by the
 * `use-trading-model` hook and persists in Firestore.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useTradingModel, type ModelSection } from '@/hooks/use-trading-model';
import { Skeleton } from '@/components/ui/skeleton';
// DND-Kit imports for drag-and-drop functionality.
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * A sortable and editable checklist item component.
 * It uses dnd-kit for drag-and-drop reordering.
 */
const SortableItem = ({ section, item, onUpdate, onDelete, isLoading }: { section: ModelSection; item: string; onUpdate: (section: ModelSection, oldItem: string, newItem: string) => void; onDelete: (section: ModelSection, item: string) => void; isLoading: boolean; }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item });
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleUpdate = () => {
        if (editText.trim() && editText.trim() !== item) {
            onUpdate(section, item, editText.trim());
        }
        setIsEditing(false);
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            {isEditing ? (
                <Input 
                    value={editText} 
                    onChange={(e) => setEditText(e.target.value)} 
                    onBlur={handleUpdate}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(); }}
                    autoFocus
                    className="h-8 flex-1"
                />
            ) : (
                <p className="flex-1 cursor-pointer" onClick={() => setIsEditing(true)}>{item}</p>
            )}
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(section, item);
                }}
                disabled={isLoading}
            >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete item</span>
            </Button>
        </div>
    );
};

/**
 * A component that renders an entire editable section of the trading model.
 */
const Section = ({ title, sectionKey, items, onAddItem, onUpdateItem, onDeleteItem, onUpdateOrder, description, isLoading }: { title: string; sectionKey: ModelSection; items: string[]; onAddItem: (section: ModelSection, item: string) => void; onUpdateItem: (section: ModelSection, oldItem: string, newItem: string) => void; onDeleteItem: (section: ModelSection, item: string) => void; onUpdateOrder: (section: ModelSection, newOrder: string[]) => void; description?: string; isLoading: boolean; }) => {
    const [newItem, setNewItem] = useState("");
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleAddItem = () => {
        if (newItem.trim()) {
            onAddItem(sectionKey, newItem.trim());
            setNewItem("");
        }
    };
    
    /**
     * Handles the end of a drag-and-drop event to reorder items.
     * @param {DragEndEvent} event - The event object from dnd-kit.
     */
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.indexOf(active.id as string);
            const newIndex = items.indexOf(over.id as string);
            onUpdateOrder(sectionKey, arrayMove(items, oldIndex, newIndex));
        }
    };
    
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-primary font-headline">{title}</h3>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="space-y-2 pl-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items} strategy={verticalListSortingStrategy}>
                        {items.map(item => <SortableItem key={item} section={sectionKey} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} isLoading={isLoading} />)}
                    </SortableContext>
                </DndContext>
            </div>
            <div className="flex gap-2 pl-2">
                <Input 
                    placeholder="Add new checklist item..." 
                    value={newItem} 
                    onChange={(e) => setNewItem(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
                    className="h-9"
                    disabled={isLoading}
                />
                <Button size="sm" onClick={handleAddItem} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
            </div>
        </div>
    );
};

/**
 * The main component for the Trading Model page.
 */
export default function TradingModelPage() {
    const { model, updateModel, isLoaded } = useTradingModel();
    const [isLoading, setIsLoading] = useState(false); // Local loading state for individual actions.

    /**
     * A wrapper function to show a loading spinner during async operations.
     * @param {() => Promise<any>} action - The async function to execute.
     */
    const handleAction = async (action: () => Promise<any>) => {
        if (isLoading) return; // Prevent multiple simultaneous actions
        setIsLoading(true);
        try {
            await action();
        } finally {
            setIsLoading(false);
        }
    };
    
    const addItem = (section: ModelSection, item: string) => {
        handleAction(async () => {
            const newModel = { ...model };
            newModel[section] = [...newModel[section], item];
            await updateModel(newModel);
        });
    };

    const updateItem = (section: ModelSection, oldItem: string, newItem: string) => {
        handleAction(async () => {
            const newModel = { ...model };
            const index = newModel[section].indexOf(oldItem);
            if (index !== -1) {
                newModel[section][index] = newItem;
                await updateModel(newModel);
            }
        });
    };

    const updateOrder = (section: ModelSection, newOrder: string[]) => {
        handleAction(async () => {
            const newModel = { ...model };
            newModel[section] = newOrder;
            await updateModel(newModel);
        });
    };

    const handleDeleteItem = (section: ModelSection, itemToDelete: string) => {
       handleAction(async () => {
            const newModel = { ...model };
            newModel[section] = newModel[section].filter((i: string) => i !== itemToDelete);
            await updateModel(newModel);
        });
    };

    // Show skeleton loader while the model is being fetched from Firestore.
    if (!isLoaded) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-64" />
                        <Skeleton className="h-4 w-full max-w-md" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight font-headline">Your Trading Model</h1>
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Trading Checklist</CardTitle>
                    <CardDescription>
                        Define your personal trading model. This checklist will appear in your trade logging form.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <Section 
                        title="Week Preparation" 
                        sectionKey="week"
                        items={model.week}
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={handleDeleteItem}
                        onUpdateOrder={updateOrder}
                        isLoading={isLoading}
                    />
                    <Section 
                        title="Daily Preparation"
                        sectionKey="day"
                        items={model.day}
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={handleDeleteItem}
                        onUpdateOrder={updateOrder}
                        isLoading={isLoading}
                    />
                    <Section 
                        title="Trigger"
                        sectionKey="trigger"
                        description="(Short Term Trade Execution on H1)"
                        items={model.trigger}
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={handleDeleteItem}
                        onUpdateOrder={updateOrder}
                        isLoading={isLoading}
                    />
                    <Section 
                        title="LTF Execution"
                        sectionKey="ltf"
                        description="(Intraday Execution)"
                        items={model.ltf}
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={handleDeleteItem}
                        onUpdateOrder={updateOrder}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
