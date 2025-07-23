
'use client';

/**
 * @fileoverview This file defines the main Sidebar component for the application.
 * It includes navigation links, a button to add new trades, and a user menu
 * for accessing profile settings, theme toggles, and logout functionality.
 * The sidebar is collapsible and responsive for mobile devices.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BrainCircuit, Book, PlusCircle, User, LogOut, Moon, Sun, Video, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useTradeForm } from '@/contexts/trade-form-context';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useStreamerMode } from '@/contexts/streamer-mode-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import * as React from 'react';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';

// Memoize the navigation items to prevent recreation on every render
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/trades', label: 'Trades', icon: Book, tooltip: 'Trade Log' },
  { href: '/analysis', label: 'Analysis', icon: BrainCircuit, tooltip: 'Analysis' },
  { href: '/discipline', label: 'Discipline', icon: ShieldCheck, tooltip: 'Discipline Checklist' },
  { href: '/model', label: 'Trading Model', icon: ClipboardCheck, tooltip: 'Trading Model' },
];

/**
 * Memoized navigation item component to prevent unnecessary re-renders
 */
const NavItem = React.memo(function NavItem({ 
  item, 
  isActive, 
  onLinkClick 
}: { 
  item: typeof NAV_ITEMS[0]; 
  isActive: boolean; 
  onLinkClick: () => void; 
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={{ children: item.tooltip, side: 'right' }}
        onClick={onLinkClick}
      >
        <Link href={item.href} prefetch={false}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

/**
 * Memoized user menu component to prevent unnecessary re-renders
 */
const UserMenu = React.memo(function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isStreamerMode, toggleStreamerMode } = useStreamerMode();

  const handleLogout = React.useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [router]);

  const handleProfileClick = React.useCallback(() => {
    router.push('/profile');
  }, [router]);

  const handleThemeChange = React.useCallback((theme: string) => {
    setTheme(theme);
  }, [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
          <User className="h-8 w-8 rounded-full bg-muted p-1.5" />
          <div className='flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden'>
            <span className='text-sm font-medium truncate'>{user?.email?.split('@')[0]}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-56 mb-2">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4"/>
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
          <div className="flex items-center justify-between w-full">
            <Label htmlFor="streamer-mode-desktop" className="flex items-center gap-2 cursor-pointer font-normal">
              <Video className="h-4 w-4" />
              <span>Streamer Mode</span>
            </Label>
            <Switch
              id="streamer-mode-desktop"
              checked={isStreamerMode}
              onCheckedChange={toggleStreamerMode}
            />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="relative h-4 w-4 mr-2">
              <Sun className="absolute h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
/**
 * The main Sidebar component.
 * It handles navigation state, theme changes, streamer mode, and user authentication actions.
 * It is memoized for performance to prevent unnecessary re-renders.
 */
export const Sidebar = React.memo(function Sidebar() {
  const pathname = usePathname();
  const { openForm } = useTradeForm(); // Context hook to open the trade form modal.
  const { setOpenMobile } = useSidebar(); // Hook to control mobile sidebar visibility.

  /**
   * Checks if a given navigation link should be considered active based on the current URL path.
   * @param {string} href - The link's href to check.
   * @returns {boolean} - True if the link is active, false otherwise.
   */
  const isActive = React.useCallback((href: string) => 
    pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard'),
    [pathname]
  );

  /**
   * Closes the mobile sidebar when a navigation link is clicked.
   */
  const handleLinkClick = React.useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);
  
  /**
   * Opens the "Add Trade" form and closes the mobile sidebar.
   */
  const handleAddTradeClick = React.useCallback(() => {
    openForm();
    setOpenMobile(false);
  }, [openForm, setOpenMobile]);

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarContent className="flex flex-col">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        
        <SidebarMenu className="flex-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              onLinkClick={handleLinkClick}
            />
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleAddTradeClick}
              tooltip={{ children: 'Add New Trade', side: 'right' }}
            >
              <PlusCircle />
              <span>Add Trade</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </SidebarContent>
    </SidebarPrimitive>
  );
});
