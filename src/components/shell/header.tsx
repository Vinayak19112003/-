
'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
    const pathname = usePathname();
    
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1">
                <h1 className="font-semibold text-lg capitalize">{pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}</h1>
            </div>
        </header>
    );
}
