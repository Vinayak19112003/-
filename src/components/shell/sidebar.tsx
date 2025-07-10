
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BrainCircuit, Book, PlusCircle, User, LogOut, Moon, Sun, Video, ClipboardCheck } from 'lucide-react';
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

export const Sidebar = React.memo(function Sidebar() {
  const pathname = usePathname();
  const { openForm } = useTradeForm();
  const router = useRouter();
  const { setTheme } = useTheme();
  const { isStreamerMode, toggleStreamerMode } = useStreamerMode();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Dashboard' },
    { href: '/analysis', label: 'Analysis', icon: BrainCircuit, tooltip: 'Analysis' },
    { href: '/discipline', label: 'Discipline', icon: ClipboardCheck, tooltip: 'Discipline' },
  ];

  const isActive = (href: string) => pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');

  const handleLinkClick = () => {
    setOpenMobile(false);
  };
  
  const handleAddTradeClick = () => {
    openForm();
    setOpenMobile(false);
  }

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarContent className="flex flex-col">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        
        <SidebarMenu className="flex-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={{ children: item.tooltip, side: 'right' }}
                    onClick={handleLinkClick}
                >
                    <Link href={item.href} prefetch={false}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
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
              <DropdownMenuItem onClick={() => router.push('/profile')}>
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
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
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
        </SidebarFooter>
      </SidebarContent>
    </SidebarPrimitive>
  );
});
