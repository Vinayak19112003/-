
"use client";

import { useCallback } from 'react';
import useJournalSettings from './use-journal-settings';
import { DEFAULT_TRADING_MODEL } from '@/lib/constants';
import { type TradingModel } from '@/lib/types';
import { useToast } from './use-toast';

export type ModelSection = keyof TradingModel;

export function useTradingModel() {
    // The `updateWholeObject` function is the key here. It replaces the entire model object in Firestore.
    // The generic `addItem` and `deleteItem` from this hook are not suitable for the complex model object.
    const { items: model, updateWholeObject, isLoaded } = useJournalSettings('tradingModel', DEFAULT_TRADING_MODEL);
    const { toast } = useToast();

    const addItem = useCallback(async (section: ModelSection, item: string) => {
        const newModel = { ...model };
        if (newModel[section].includes(item)) {
            toast({
                variant: 'destructive',
                title: 'Item Exists',
                description: 'This item is already in your checklist.',
            });
            return false;
        }
        newModel[section] = [...newModel[section], item];
        return await updateWholeObject(newModel);
    }, [model, updateWholeObject, toast]);

    const updateItem = useCallback(async (section: ModelSection, oldItem: string, newItem: string) => {
        const newModel = { ...model };
        const index = newModel[section].indexOf(oldItem);
        if (index !== -1) {
            newModel[section][index] = newItem;
            return await updateWholeObject(newModel);
        }
        return false;
    }, [model, updateWholeObject]);
    
    const updateOrder = useCallback(async (section: ModelSection, newOrder: string[]) => {
        const newModel = { ...model };
        newModel[section] = newOrder;
        await updateWholeObject(newModel);
    }, [model, updateWholeObject]);

    // The delete logic is now handled directly in the page component to ensure correctness.
    // We only expose the necessary parts: the model, functions to modify it, and the loading state.
    return { model, addItem, updateItem, updateOrder, updateModel: updateWholeObject, isLoaded };
}
