
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

type SettingsTab = 'general' | 'accounts' | 'tags';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General Settings', icon: SettingsIcon },
    { id: 'accounts', label: 'Account Management', icon: Users },
    { id: 'tags', label: 'Tag Management', icon: Tag },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return <GeneralSettings />;
            case 'accounts':
                return <ManageAccountsCard />;
            case 'tags':
                return <TagManagement />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight font-headline">Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                <Card className="lg:col-span-1">
                    <CardContent className="p-2">
                        <nav className="space-y-1">
                            {TABS.map(tab => (
                                <Button
                                    key={tab.id}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start text-left",
                                        activeTab === tab.id && "bg-muted font-semibold"
                                    )}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon className="mr-2 h-4 w-4" />
                                    {tab.label}
                                </Button>
                            ))}
                        </nav>
                    </CardContent>
                </Card>
                <div className="lg:col-span-3">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
