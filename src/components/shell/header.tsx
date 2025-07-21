
'use client';

/**
 * @fileoverview This file defines the Header component, which acts as the main topbar navigation.
 * It includes the application logo, primary navigation links, an "Add Trade" button,
 * and the user menu. It is responsive and adapts for mobile viewing.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const NAV_LINKS = [
  { icon: Home, text: 'Dashboard', href: '/dashboard' },
  { icon: Package, text: 'Journal', href: '/journal' },
  { icon: LineChart, text: 'Analytics', href: '/analytics' },
  { icon: Users, text: 'Performance', href: '/performance' },
];

export const Header = React.memo(function Header() {
    const pathname = usePathname();
    const { user } = useAuth();
    const { openForm } = useTradeForm();
    const { isStreamerMode, toggleStreamerMode } = useStreamerMode();
    
    return (
        <header className="sticky top-0 z-50 flex h-auto flex-col items-center gap-4 border-b bg-background px-4 md:px-6">
            {/* Top Row */}
            <div className='w-full flex items-center justify-between h-16'>
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
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center gap-2 text-lg font-semibold"
                                    >
                                        <Logo />
                                        <span className="sr-only">Anony Trading</span>
                                    </Link>
                                </SheetClose>

                                {NAV_LINKS.map(link => (
                                    <SheetClose asChild key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                                pathname === link.href && "bg-muted text-primary"
                                            )}
                                        >
                                            <link.icon className="h-4 w-4" />
                                            {link.text}
                                        </Link>
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
                    <div className="hidden md:flex items-center gap-2">
                        <Label htmlFor="streamer-mode-switch" className="text-sm text-muted-foreground">Streamer Mode</Label>
                        <Switch id="streamer-mode-switch" checked={isStreamerMode} onCheckedChange={toggleStreamerMode} />
                    </div>
                     <ModeToggle />
                     <UserMenu />
                </div>
            </div>
            
            {/* Bottom Row - Navigation */}
            <div className='w-full flex items-center justify-between pb-2'>
                <nav className="hidden md:flex">
                     <Tabs value={pathname} className="w-full">
                        <TabsList>
                            {NAV_LINKS.map(link => (
                                <Link key={link.href} href={link.href} passHref>
                                    <TabsTrigger value={link.href} className='gap-2'>
                                        <link.icon className="h-4 w-4" />
                                        {link.text}
                                    </TabsTrigger>
                                </Link>
                            ))}
                        </TabsList>
                    </Tabs>
                </nav>
                <div className='ml-auto'>
                    <Button onClick={() => openForm()} size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Trade
                    </Button>
                </div>
            </div>
        </header>
    );
});
