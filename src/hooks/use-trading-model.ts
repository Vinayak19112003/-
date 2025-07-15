
"use client";

import { useCallback } from 'react';
import useJournalSettings from './use-journal-settings';
import { DEFAULT_TRADING_MODEL } from '@/lib/constants';
import { type TradingModel } from '@/lib/types';
import { useToast } from './use-toast';

export type ModelSection = keyof TradingModel;

export function useTradingModel() {
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
            return;
        }
        newModel[section] = [...newModel[section], item];
        await updateWholeObject(newModel);
    }, [model, updateWholeObject, toast]);

    const updateItem = useCallback(async (section: ModelSection, oldItem: string, newItem: string) => {
        const newModel = { ...model };
        const index = newModel[section].indexOf(oldItem);
        if (index !== -1) {
            newModel[section][index] = newItem;
            await updateWholeObject(newModel);
        }
    }, [model, updateWholeObject]);
    
    const deleteItem = useCallback(async (section: ModelSection, itemToDelete: string) => {
        const newModel = { ...model };
        newModel[section] = newModel[section].filter((i: string) => i !== itemToDelete);
        await updateWholeObject(newModel);
    }, [model, updateWholeObject]);
    
    const updateOrder = useCallback(async (section: ModelSection, newOrder: string[]) => {
        const newModel = { ...model };
        newModel[section] = newOrder;
        await updateWholeObject(newModel);
    }, [model, updateWholeObject]);

    return { model, addItem, updateItem, deleteItem, updateOrder, isLoaded };
}
