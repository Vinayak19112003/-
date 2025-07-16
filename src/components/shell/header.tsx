
'use client';

/**
 * @fileoverview This file defines the Header component for the application.
 * The header is displayed at the top of the main content area for all authenticated pages.
 * It includes a trigger to open the mobile sidebar and displays the capitalized title
 * of the current page based on the URL path.
 */

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import * as React from 'react';

/**
 * The main Header component.
 * It is memoized for performance to avoid re-rendering on every path change
 * if its content doesn't need to update.
 */
export const Header = React.memo(function Header() {
    const pathname = usePathname();
    
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            {/* Renders the hamburger icon to toggle the sidebar on mobile */}
            <SidebarTrigger />
            <div className="w-full flex-1">
                {/* Dynamically sets the page title from the last segment of the URL */}
                <h1 className="font-semibold text-lg capitalize">{pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}</h1>
            </div>
        </header>
    );
});
