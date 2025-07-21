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

const NAV_LINKS = [
  { icon: Home, text: 'Dashboard', href: '/dashboard' },
  { icon: Package, text: 'Journal', href: '/journal' },
  { icon: LineChart, text: 'Analytics', href: '/analytics' },
  { icon: Users, text: 'Performance', href: '/performance' },
];

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link
            href={href}
            className={cn(
                "transition-colors hover:text-foreground text-sm",
                isActive ? "text-foreground font-semibold" : "text-muted-foreground"
            )}
        >
            {children}
        </Link>
    );
};

const MobileNavLink = ({ href, children, icon: Icon }: { href: string; children: React.ReactNode, icon: React.ElementType }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <SheetClose asChild>
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                )}
            >
                <Icon className="h-4 w-4" />
                {children}
            </Link>
        </SheetClose>
    );
};


export const Header = React.memo(function Header() {
    const { openForm } = useTradeForm();
    const { isStreamerMode, toggleStreamerMode } = useStreamerMode();
    
    return (
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-lg font-semibold md:text-base"
                >
                    <Logo />
                    <span className="sr-only">Anony Trading</span>
                </Link>
                {NAV_LINKS.map(link => (
                    <NavLink key={link.href} href={link.href}>{link.text}</NavLink>
                ))}
            </nav>
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
                             <MobileNavLink key={link.href} href={link.href} icon={link.icon}>{link.text}</MobileNavLink>
                        ))}

                        <SheetClose asChild>
                            <Link
                                href="/settings"
                                className="flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </Link>
                        </SheetClose>
                    </nav>
                </SheetContent>
            </Sheet>
            <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className="hidden md:flex items-center gap-2">
                    <Label htmlFor="streamer-mode-switch" className="text-sm text-muted-foreground">Streamer Mode</Label>
                    <Switch id="streamer-mode-switch" checked={isStreamerMode} onCheckedChange={toggleStreamerMode} />
                </div>
                 <ModeToggle />
                 <Button onClick={() => openForm()} size="sm" className="hidden sm:flex">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Trade
                </Button>
                 <UserMenu />
            </div>
        </header>
    );
});