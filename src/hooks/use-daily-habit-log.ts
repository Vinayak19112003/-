
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from './use-auth';
import { format } from 'date-fns';
import { useToast } from './use-toast';

const HABIT_LOGS_COLLECTION = 'habitLogs';

type DailyLog = {
    date: Timestamp;
    habits: string[];
};

export function useDailyHabitLog(date: Date = new Date()) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const dateKey = format(date, 'yyyy-MM-dd');

    const getLogDocRef = useCallback(() => {
        if (!user) return null;
        return doc(db, 'users', user.uid, HABIT_LOGS_COLLECTION, dateKey);
    }, [user, dateKey]);

    useEffect(() => {
        const docRef = getLogDocRef();
        if (!docRef) {
            setIsLoaded(true);
            return;
        }

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setDailyLog(docSnap.data() as DailyLog);
            } else {
                setDailyLog(null); // No log for this day yet
            }
            setIsLoaded(true);
        }, (error) => {
            console.error("Error fetching daily log:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load daily habit log.' });
            setIsLoaded(true);
        });

        return () => unsubscribe();
    }, [getLogDocRef, toast]);

    const toggleHabit = async (habit: string) => {
        const docRef = getLogDocRef();
        if (!docRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to track habits.' });
            return;
        }

        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const currentHabits = docSnap.data().habits || [];
                const isCompleted = currentHabits.includes(habit);
                await updateDoc(docRef, {
                    habits: isCompleted ? arrayRemove(habit) : arrayUnion(habit)
                });
            } else {
                // If document doesn't exist, create it
                await setDoc(docRef, {
                    date: Timestamp.fromDate(date),
                    habits: [habit]
                });
            }
        } catch (error) {
            console.error('Failed to toggle habit:', error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update your habit progress.' });
        }
    };

    return { dailyLog, toggleHabit, isLoaded };
}
