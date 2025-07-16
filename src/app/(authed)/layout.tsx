
'use client';

/**
 * @fileoverview This is the main layout for all authenticated pages in the application.
 * It wraps the content of each page with common UI elements like the sidebar and header.
 * It also contains the logic for the "Add/Edit Trade" form, which is presented as a
 * modal dialog or a sheet on mobile devices.
 */

import { useState, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Trade } from '@/lib/types';
import { Sidebar } from '@/components/shell/sidebar';
import AuthGuard from '@/components/auth/auth-guard';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TradeFormProvider } from '@/contexts/trade-form-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { TradesProvider } from '@/contexts/trades-context';
import { Header } from '@/components/shell/header';

// Dynamically import the TradeForm to optimize the initial bundle size.
// The form is only loaded when the user triggers it.
const TradeForm = dynamic(() => import('@/components/dashboard/trade-form').then(mod => mod.TradeForm), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
});

/**
 * The main content component for the authenticated layout.
 * It manages the state of the trade form (open/closed, editing/new).
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The page content to be rendered.
 */
const AuthedLayoutContent = memo(function AuthedLayoutContent({ children }: { children: React.ReactNode }) {
  // State for controlling the trade form's visibility.
  const [isFormOpen, setIsFormOpen] = useState(false);
  // State to hold the trade data when editing an existing trade.
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const isMobile = useIsMobile();

  /**
   * Opens the trade form. If a trade object is provided, it sets the form
   * to editing mode; otherwise, it's a new trade.
   * @param {Trade} [trade] - The optional trade object to edit.
   */
  const handleOpenForm = (trade?: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  /**
   * Closes the trade form and resets the editing state.
   */
  const handleCloseForm = () => {
    setEditingTrade(undefined);
    setIsFormOpen(false);
  };

  /**
   * A callback function that is triggered on successful save of a trade.
   * It closes the form.
   */
  const handleSaveSuccess = () => {
    handleCloseForm();
  }

  // Choose the appropriate modal component based on the device type.
  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;
  const FormHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const FormTitleComponent = isMobile ? SheetTitle : DialogTitle;
  const FormDescriptionComponent = isMobile ? SheetDescription : DialogDescription;
  
  // Memoize the context value for the TradeForm to prevent unnecessary re-renders.
  const tradeFormValue = useMemo(() => ({ openForm: handleOpenForm }), []);

  return (
    <AuthGuard>
      <TradeFormProvider value={tradeFormValue}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-muted/40">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Header />
              <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-y-auto transition-all duration-300 ease-in-out">
                  {children}
              </main>
            </div>
          </div>
          {/* Render the trade form modal/sheet */}
          <FormComponent open={isFormOpen} onOpenChange={setIsFormOpen}>
              <FormContentComponent className={cn(isMobile ? "w-full" : "max-w-4xl")}>
                  <FormHeaderComponent>
                  <FormTitleComponent>{editingTrade ? "Edit Trade" : "Add New Trade"}</FormTitleComponent>
                  <FormDescriptionComponent>
                      Fill in the details of your trade. Accurate records lead to better insights.
                  </FormDescriptionComponent>
                  </FormHeaderComponent>
                  <div className={cn("p-4 overflow-y-auto max-h-[80vh]")}>
                      <TradeForm
                        trade={editingTrade}
                        onSaveSuccess={handleSaveSuccess}
                        setOpen={setIsFormOpen}
                      />
                  </div>
              </FormContentComponent>
          </FormComponent>
        </SidebarProvider>
      </TradeFormProvider>
    </AuthGuard>
  );
});

/**
 * The root layout component for all authenticated pages.
 * It wraps the main content with necessary context providers.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The page content passed by Next.js.
 */
export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TradesProvider>
      <AuthedLayoutContent>{children}</AuthedLayoutContent>
    </TradesProvider>
  )
}
