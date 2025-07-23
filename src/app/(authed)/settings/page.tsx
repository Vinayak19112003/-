
'use client';

/**
 * @fileoverview This file defines the user Settings page.
 * It uses a two-column layout with a sidebar for navigating different
 * settings panels (General, Accounts, Tag Management).
 */

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Settings as SettingsIcon, Shield, Tag, Users } from 'lucide-react';
import GeneralSettings from '@/components/settings/general-settings';
import { ManageAccountsCard } from '@/components/settings/manage-accounts-card';
import TagManagement from '@/components/settings/tag-management';

interface SettingsPageProps {
  trades: any[]; // Trades prop is not used here but required by the main layout
}

export default function SettingsPage({ trades }: SettingsPageProps) {
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 grid gap-6">
                <GeneralSettings />
                <TagManagement />
            </div>
            <div className="lg:col-span-1">
                <ManageAccountsCard />
            </div>
        </div>
    );
}
