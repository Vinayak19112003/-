
'use client';

import { useState } from 'react';
import type { Trade } from '@/lib/types';
import { Sidebar } from '@/components/shell/sidebar';
import { Header } from '@/components/shell/header';
import AuthGuard from '@/components/auth/auth-guard';
import { useTrades } from '@/hooks/use-trades';
import { useStrategies } from '@/hooks/use-strategies';
import { useTradingRules } from '@/hooks/use-trading-rules';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';
import { TradeForm } from '@/components/dashboard/trade-form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TradeFormProvider } from '@/contexts/trade-form-context';

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { addTrade, updateTrade } = useTrades();
  const { strategies, addStrategy, deleteStrategy } = useStrategies();
  const { tradingRules, addTradingRule, deleteTradingRule } = useTradingRules();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const isMobile = useIsMobile();

  const handleOpenForm = (trade?: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingTrade(undefined);
    setIsFormOpen(false);
  };

  const handleSaveTrade = async (trade: Trade) => {
    try {
      if (editingTrade) {
        await updateTrade(trade);
      } else {
        await addTrade(trade);
      }
      handleCloseForm();
    } catch (error) {
      console.error("Error saving trade from layout level:", error);
      throw error;
    }
  };

  const FormComponent = isMobile ? Sheet : Dialog;
  const FormContentComponent = isMobile ? SheetContent : DialogContent;
  const FormHeaderComponent = isMobile ? SheetHeader : DialogHeader;
  const FormTitleComponent = isMobile ? SheetTitle : DialogTitle;
  const FormDescriptionComponent = isMobile ? SheetDescription : DialogDescription;

  return (
    <AuthGuard>
      <TradeFormProvider value={{ openForm: handleOpenForm }}>
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <Sidebar />
          <div className="flex flex-col">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40 overflow-y-auto">
                {children}
            </main>
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
                        onSave={handleSaveTrade} 
                        setOpen={setIsFormOpen}
                        strategies={strategies}
                        addStrategy={addStrategy}
                        deleteStrategy={deleteStrategy}
                        tradingRules={tradingRules}
                        addTradingRule={addTradingRule}
                        deleteTradingRule={deleteTradingRule}
                      />
                  </div>
              </FormContentComponent>
          </FormComponent>
        </div>
      </TradeFormProvider>
    </AuthGuard>
  );
}
