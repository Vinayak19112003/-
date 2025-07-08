
'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, PlusCircle, LayoutDashboard, BrainCircuit, Book, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { useTradeForm } from '@/contexts/trade-form-context';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
    const pathname = usePathname();
    const { openForm } = useTradeForm();
    const { user } = useAuth();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/analysis', label: 'Analysis', icon: BrainCircuit },
        { href: '/trades', label: 'Trades', icon: Book },
    ];
    
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                    >
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <nav className="grid gap-2 text-lg font-medium">
                        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
                            <Logo />
                            <span className="sr-only">Anony Trading</span>
                        </Link>
                        {navItems.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                                    pathname.startsWith(item.href) && "bg-muted text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={() => openForm()}
                             className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                        >
                            <PlusCircle className="h-5 w-5" />
                            Add Trade
                        </button>
                    </nav>
                     <div className="mt-auto">
                        <Link
                            href="/profile"
                            className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                        >
                            <User className="h-5 w-5" />
                            Profile ({user?.email?.split('@')[0]})
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>
            <div className="w-full flex-1">
                <h1 className="font-semibold text-lg">{pathname.split('/').pop()?.replace(/^\w/, c => c.toUpperCase()) || 'Dashboard'}</h1>
            </div>
        </header>
    );
}
