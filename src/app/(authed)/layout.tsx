
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Trade } from '@/lib/types';
import { Sidebar } from '@/components/shell/sidebar';
import { Header } from '@/components/shell/header';
import AuthGuard from '@/components/auth/auth-guard';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TradeFormProvider } from '@/contexts/trade-form-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { TradesProvider, useTrades } from '@/contexts/trades-context';

const TradeForm = dynamic(() => import('@/components/dashboard/trade-form').then(mod => mod.TradeForm), { 
    ssr: false, 
    loading: () => (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
});

function AuthedLayoutContent({ children }: { children: React.ReactNode }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const isMobile = useIsMobile();
  const { fetchTrades } = useTrades();

  const handleOpenForm = (trade?: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTrade(undefined);
    setIsFormOpen(false);
  };
  
  const handleSaveSuccess = () => {
    handleCloseForm();
    // Refreshes the data using the last used query options after a save.
    // The `newQuery: true` ensures it starts from the beginning.
    fetchTrades({ newQuery: true });
  }

  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;
  const FormHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const FormTitleComponent = isMobile ? SheetTitle : DialogTitle;
  const FormDescriptionComponent = isMobile ? SheetDescription : DialogDescription;

  return (
    <AuthGuard>
      <TradeFormProvider value={{ openForm: handleOpenForm }}>
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
}


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
