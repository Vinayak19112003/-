import { AreaChart } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <AreaChart className="h-6 w-6 text-primary" />
      <h1 className="font-headline text-xl font-semibold tracking-tight">
        TradeVision Journal
      </h1>
    </div>
  );
}
