
"use client";

import { useCallback } from 'react';
import useJournalSettings from './use-journal-settings';
import { DEFAULT_TRADING_MODEL } from '@/lib/constants';
import { type TradingModel } from '@/lib/types';
import { useToast } from './use-toast';

export type ModelSection = keyof TradingModel;

export function useTradingModel() {
    // The `updateWholeObject` function is the key here. It replaces the entire model object in Firestore.
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

    // Expose the model, modification functions, and loading state.
    // The 'updateModel' alias for updateWholeObject allows the page to save the entire new model state.
    return { model, addItem, updateItem, updateOrder, updateModel: updateWholeObject, isLoaded };
}
