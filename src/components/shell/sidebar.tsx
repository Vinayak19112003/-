
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  PlusCircle,
  Settings,
  Users,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserMenu } from './user-menu';
import {
  Sidebar as AppSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarNavLink,
} from '@/components/ui/sidebar';
import { useTradeForm } from '@/contexts/trade-form-context';

const NAV_LINKS = [
  { icon: Home, text: 'Dashboard', href: '/dashboard' },
  { icon: LineChart, text: 'Analytics', href: '/analytics' },
  { icon: Package, text: 'Journal', href: '/journal' },
  { icon: Users, text: 'Performance', href: '/performance' },
  { icon: Settings, text: 'Settings', href: '/settings' },
];

export const Sidebar = React.memo(function Sidebar() {
  const { open } = useTradeForm();
  return (
    <AppSidebar>
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">AnonyTrade</span>
            </Link>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {NAV_LINKS.map((link) => (
                <SidebarNavLink
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                >
                  {link.text}
                </SidebarNavLink>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => open()}
                  className="flex items-center gap-3"
                >
                  <PlusCircle />
                  <span>Add Trade</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
          <div className="mt-auto p-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </AppSidebar>
  );
});
