
'use client';

/**
 * @fileoverview This file defines the Header component, which acts as the main topbar navigation.
 * It includes the application logo, primary navigation links, an "Add Trade" button,
 * and the user menu. It is responsive and adapts for mobile viewing.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Home, LineChart, Menu, Package, Package2, PlusCircle, Settings, Users } from 'lucide-react';
import { UserMenu } from './user-menu';
import { useTradeForm } from '@/contexts/trade-form-context';
import { Logo } from '../logo';
import { ModeToggle } from '../mode-toggle';
import { useStreamerMode } from '@/contexts/streamer-mode-context';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountSwitcher } from './account-switcher';

const NAV_LINKS = [
  { value: 'dashboard', text: 'Dashboard', icon: Home },
  { value: 'journal', text: 'Journal', icon: Package },
  { value: 'analytics', text: 'Analytics', icon: LineChart },
  { value: 'performance', text: 'Performance', icon: Users },
  { value: 'settings', text: 'Settings', icon: Settings },
];

export const Header = React.memo(function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { openForm } = useTradeForm();
    const { isStreamerMode, toggleStreamerMode } = useStreamerMode();

    const handleMobileNavClick = (value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set("tab", value);
        const search = current.toString();
        const query = search ? `?${search}` : "";
        router.push(`${pathname}${query}`);
    };
    
    return (
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className='w-full flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <nav className="grid gap-6 text-lg font-medium">
                                <SheetClose asChild>
                                     <div className="flex items-center gap-2 text-lg font-semibold">
                                        <Logo />
                                        <span className="sr-only">Anony Trading</span>
                                    </div>
                                </SheetClose>

                                {NAV_LINKS.map(link => (
                                    <SheetClose asChild key={link.value}>
                                        <button
                                            onClick={() => handleMobileNavClick(link.value)}
                                            className={cn(
                                                "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                (searchParams.get('tab') || 'dashboard') === link.value && "bg-muted text-primary"
                                            )}
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.text}
                                        </button>
                                    </SheetClose>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="hidden md:block">
                        <Logo />
                    </div>
                </div>
                <div className="hidden md:flex flex-col items-start">
                    <p className='text-sm font-semibold'>Welcome back,</p>
                    <p className='text-xs text-muted-foreground'>{user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                    <AccountSwitcher />
                    <div className="hidden md:flex items-center gap-2">
                        <Label htmlFor="streamer-mode-switch" className="text-sm text-muted-foreground">Streamer Mode</Label>
                        <Switch id="streamer-mode-switch" checked={isStreamerMode} onCheckedChange={toggleStreamerMode} />
                    </div>
                     <ModeToggle />
                     <UserMenu />
                     <Button onClick={() => openForm()} size="sm" className="hidden lg:flex">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Trade
                    </Button>
                </div>
            </div>
        </header>
    );
});
