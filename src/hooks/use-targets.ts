
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'userConfig';

type Targets = {
    profit: number;
    loss: number;
};

export function useTargets() {
    const { user } = useAuth();
    const [targets, setTargets] = useState<Targets>({ profit: 0, loss: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();

    const getSettingsDocRef = useCallback(() => {
        if (!user || !db) return null;
        return doc(db, 'users', user.uid, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    }, [user]);

    useEffect(() => {
        if (!user) {
            setIsLoaded(true);
            return;
        }

        const docRef = getSettingsDocRef();
        if (!docRef) {
            setIsLoaded(true);
            return;
        }

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTargets({
                    profit: data.targetProfit || 0,
                    loss: data.targetLoss || 0,
                });
            }
            setIsLoaded(true);
        }, (error) => {
            console.error("Error with targets snapshot:", error);
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: `Could not load targets.`,
            });
            setIsLoaded(true);
        });

        return () => unsubscribe();
    }, [user, getSettingsDocRef, toast]);

    const updateTargets = async (newTargets: Partial<Targets>) => {
        const docRef = getSettingsDocRef();
        if (!docRef) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to update targets.' });
            return;
        }

        try {
            const docSnap = await getDoc(docRef);
            const updateData: { [key: string]: number } = {};
            if (newTargets.profit !== undefined) updateData.targetProfit = newTargets.profit;
            if (newTargets.loss !== undefined) updateData.targetLoss = newTargets.loss;

            if (docSnap.exists()) {
                await updateDoc(docRef, updateData);
            } else {
                // This case should ideally be handled by the useJournalSettings initialization,
                // but as a fallback, we create/merge the document.
                await setDoc(docRef, updateData, { merge: true });
            }

            toast({
                title: "Targets Updated",
                description: "Your profit and loss targets have been saved.",
            });
        } catch (error) {
            console.error("Error updating targets:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save your targets.",
            });
        }
    };

    return { targets, updateTargets, isLoaded };
}
