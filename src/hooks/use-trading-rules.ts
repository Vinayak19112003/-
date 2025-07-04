
"use client";

import useJournalSettings from './use-journal-settings';
import { DEFAULT_TRADING_RULES } from '@/lib/constants';

export function useTradingRules() {
    const { items, addItem, deleteItem, isLoaded } = useJournalSettings('tradingRules', DEFAULT_TRADING_RULES);
    return { tradingRules: items, addTradingRule: addItem, deleteTradingRule: deleteItem, isLoaded };
}
