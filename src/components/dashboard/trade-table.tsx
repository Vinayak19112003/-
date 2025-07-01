
"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";

type TradeTableProps = {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
};

type SortKey = keyof Trade | "rr";

export function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({ key: 'date', direction: 'desc' });
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);

  const handleConfirmDelete = () => {
    if (tradeToDelete) {
      onDelete(tradeToDelete.id);
      setTradeToDelete(null);
    }
  };

  const sortedAndFilteredTrades = useMemo(() => {
    let filtered = trades.filter(trade =>
      (trade.asset.toLowerCase().includes(filter.toLowerCase()) ||
       trade.strategy.toLowerCase().includes(filter.toLowerCase()) ||
       trade.notes?.toLowerCase().includes(filter.toLowerCase()) ||
       trade.mistakes?.some(m => m.toLowerCase().includes(filter.toLowerCase())))
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Trade];
        const bVal = b[sortConfig.key as keyof Trade];
        
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (sortConfig.key === 'date') {
            const dateA = new Date(aVal as string | number | Date).getTime();
            const dateB = new Date(bVal as string | number | Date).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [trades, filter, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return sortConfig.direction === 'desc' ? '🔽' : '🔼';
  };

  const ResultBadge = ({ result }: { result: Trade["result"] }) => {
    const variant = {
      Win: "default",
      Loss: "destructive",
      BE: "secondary",
      Missed: "secondary"
    }[result] as "default" | "destructive" | "secondary";
    return <Badge variant={variant}>{result}</Badge>;
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          placeholder="Filter by asset, strategy, notes, mistakes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("date")} className="cursor-pointer">Date {getSortIndicator("date")}</TableHead>
              <TableHead onClick={() => requestSort("asset")} className="cursor-pointer">Asset {getSortIndicator("asset")}</TableHead>
              <TableHead onClick={() => requestSort("strategy")} className="cursor-pointer">Strategy {getSortIndicator("strategy")}</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead onClick={() => requestSort("rr")} className="cursor-pointer">RR {getSortIndicator("rr")}</TableHead>
              <TableHead onClick={() => requestSort("result")} className="cursor-pointer">Result {getSortIndicator("result")}</TableHead>
              <TableHead>Mistakes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredTrades.length > 0 ? (
              sortedAndFilteredTrades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>{format(trade.date, "dd MMM yyyy")}</TableCell>
                  <TableCell>{trade.asset}</TableCell>
                  <TableCell>{trade.strategy}</TableCell>
                  <TableCell>
                    <span className={cn("font-semibold", trade.direction === 'Buy' ? 'text-primary' : 'text-destructive')}>
                        {trade.direction}
                    </span>
                  </TableCell>
                  <TableCell>{trade.rr?.toFixed(2)}</TableCell>
                  <TableCell><ResultBadge result={trade.result} /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {trade.mistakes?.map(mistake => (
                            <Badge key={mistake} variant="outline">{mistake}</Badge>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onEdit(trade)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setTradeToDelete(trade)} className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No trades found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!tradeToDelete} onOpenChange={(open) => !open && setTradeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this trade from your log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
