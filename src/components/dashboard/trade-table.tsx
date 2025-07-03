
"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
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
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontal, ArrowUpDown, ImageIcon, Trash2, Edit, Eye } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { TradeDetailsDialog } from "./trade-details-dialog";

type TradeTableProps = {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
};

type SortKey = keyof Trade | "returnPercentage";

const ResultBadge = ({ result }: { result: Trade["result"] }) => {
    const variant = {
      Win: "success",
      Loss: "destructive",
      BE: "secondary",
      Missed: "secondary"
    }[result] as "success" | "destructive" | "secondary";
    return <Badge variant={variant}>{result}</Badge>;
};

export function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" } | null>({ key: 'date', direction: 'desc' });
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleViewTrade = (trade: Trade) => {
    setViewingTrade(trade);
  };

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
        if (sortConfig.key === 'returnPercentage') {
            const returnA = a.accountSize && a.accountSize > 0 && a.pnl != null ? (a.pnl / a.accountSize) * 100 : 0;
            const returnB = b.accountSize && b.accountSize > 0 && b.pnl != null ? (b.pnl / b.accountSize) * 100 : 0;

            if (sortConfig.direction === 'asc') {
                return returnA - returnB;
            } else {
                return returnB - returnA;
            }
        }
        
        const aVal = a[sortConfig.key as keyof Trade];
        const bVal = b[sortConfig.key as keyof Trade];
        
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (sortConfig.key === 'date') {
            const dateA = new Date(aVal as string | number | Date).getTime();
            const dateB = new Date(bVal as string | number | Date).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (String(aVal) < String(bVal)) return sortConfig.direction === 'asc' ? -1 : 1;
        if (String(aVal) > String(bVal)) return sortConfig.direction === 'asc' ? 1 : -1;
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
  
  if (!mounted) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-72 w-full" />
        </div>
    );
  }

  if (isMobile) {
    return (
        <div className="w-full space-y-4">
            <Input
                placeholder="Filter trades..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full"
            />
            <div className="space-y-4">
            {sortedAndFilteredTrades.length > 0 ? (
              sortedAndFilteredTrades.map((trade) => {
                const returnPercentage = trade.accountSize && trade.accountSize > 0 && trade.pnl != null ? (trade.pnl / trade.accountSize) * 100 : 0;
                return (
                    <Card key={trade.id} className="w-full">
                        <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{trade.asset}</CardTitle>
                                    <CardDescription>{format(trade.date, "PPP")}</CardDescription>
                                </div>
                                <ResultBadge result={trade.result} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-medium text-muted-foreground">Direction</div>
                            <div className={cn("font-semibold", trade.direction === 'Buy' ? 'text-success' : 'text-destructive')}>{trade.direction}</div>
                            
                            <div className="font-medium text-muted-foreground">PNL ($)</div>
                            <div>
                                <StreamerModeText className={cn("font-medium", trade.pnl != null && trade.pnl > 0 ? 'text-success' : trade.pnl != null && trade.pnl < 0 ? 'text-destructive' : '')}>
                                    {trade.pnl != null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : 'N/A'}
                                </StreamerModeText>
                            </div>

                            <div className="font-medium text-muted-foreground">Return %</div>
                            <div>
                                <StreamerModeText className={cn("font-medium", returnPercentage > 0 ? 'text-success' : returnPercentage < 0 ? 'text-destructive' : '')}>
                                    {trade.accountSize && trade.accountSize > 0 ? `${returnPercentage.toFixed(2)}%` : 'N/A'}
                                </StreamerModeText>
                            </div>
                            
                            <div className="font-medium text-muted-foreground">RR</div>
                            <div>{trade.rr?.toFixed(2) ?? 'N/A'}</div>
                            
                            <div className="font-medium text-muted-foreground">Strategy</div>
                            <div className="truncate">{trade.strategy}</div>
                            
                            <div className="font-medium text-muted-foreground">Confidence</div>
                            <div>{trade.confidence} / 10</div>

                            {trade.mistakes && trade.mistakes.length > 0 && (
                                <>
                                    <div className="font-medium text-muted-foreground col-span-2 mt-2">Mistakes</div>
                                    <div className="col-span-2 flex flex-wrap gap-1">
                                    {trade.mistakes.map(mistake => (
                                        <Badge key={mistake} variant="outline">{mistake}</Badge>
                                    ))}
                                    </div>
                                </>
                            )}
                            
                            <div className="col-span-2 mt-4 flex justify-between items-center">
                                <Button variant="secondary" size="sm" onClick={() => handleViewTrade(trade)}>
                                    View Details
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-5 w-5" />
                                            <span className="sr-only">More options</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => onEdit(trade)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setTradeToDelete(trade)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                )
              })
            ) : (
                <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                    No trades found.
                </div>
            )}
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
    )
  }

  return (
    <div className="w-full space-y-4">
        <Input
          placeholder="Filter by asset, strategy, notes, mistakes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => requestSort("date")} className="cursor-pointer">Date {getSortIndicator("date")}</TableHead>
              <TableHead onClick={() => requestSort("asset")} className="cursor-pointer">Asset {getSortIndicator("asset")}</TableHead>
              <TableHead onClick={() => requestSort("strategy")} className="cursor-pointer">Strategy {getSortIndicator("strategy")}</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead onClick={() => requestSort("rr")} className="cursor-pointer text-center">RR {getSortIndicator("rr")}</TableHead>
              <TableHead onClick={() => requestSort("pnl")} className="cursor-pointer text-right">PNL ($) {getSortIndicator("pnl")}</TableHead>
              <TableHead onClick={() => requestSort("returnPercentage")} className="cursor-pointer text-right">Return % {getSortIndicator("returnPercentage")}</TableHead>
              <TableHead onClick={() => requestSort("confidence")} className="cursor-pointer text-center">Confidence {getSortIndicator("confidence")}</TableHead>
              <TableHead onClick={() => requestSort("result")} className="cursor-pointer">Result {getSortIndicator("result")}</TableHead>
              <TableHead>Mistakes</TableHead>
              <TableHead className="text-center">Screenshot</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredTrades.length > 0 ? (
              sortedAndFilteredTrades.map((trade) => {
                const returnPercentage = trade.accountSize && trade.accountSize > 0 && trade.pnl != null ? (trade.pnl / trade.accountSize) * 100 : 0;
                
                return (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{format(trade.date, "dd MMM yyyy")}</TableCell>
                    <TableCell>{trade.asset}</TableCell>
                    <TableCell>{trade.strategy}</TableCell>
                    <TableCell>
                      <span className={cn("font-semibold", trade.direction === 'Buy' ? 'text-success' : 'text-destructive')}>
                          {trade.direction}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{trade.rr?.toFixed(2) ?? 'N/A'}</TableCell>
                    <TableCell>
                      <StreamerModeText className={cn("text-right font-medium", trade.pnl != null && trade.pnl > 0 ? 'text-success' : trade.pnl != null && trade.pnl < 0 ? 'text-destructive' : '')}>
                        {trade.pnl != null ? `$${trade.pnl.toFixed(2)}` : 'N/A'}
                      </StreamerModeText>
                    </TableCell>
                    <TableCell>
                       <StreamerModeText className={cn("text-right font-medium", returnPercentage > 0 ? 'text-success' : returnPercentage < 0 ? 'text-destructive' : '')}>
                        {trade.accountSize && trade.accountSize > 0 ? `${returnPercentage.toFixed(2)}%` : 'N/A'}
                       </StreamerModeText>
                    </TableCell>
                    <TableCell className="text-center">{trade.confidence}</TableCell>
                    <TableCell><ResultBadge result={trade.result} /></TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                            {trade.mistakes?.map(mistake => (
                                <Badge key={mistake} variant="outline">{mistake}</Badge>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {trade.screenshotURL && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <ImageIcon className="h-5 w-5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Trade Screenshot</DialogTitle>
                            </DialogHeader>
                            <div className="relative h-[80vh]">
                                <Image
                                    src={trade.screenshotURL}
                                    alt={`Screenshot for trade on ${trade.asset}`}
                                    fill
                                    style={{objectFit: 'contain'}}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuItem onSelect={() => handleViewTrade(trade)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => onEdit(trade)}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                           </DropdownMenuItem>
                           <DropdownMenuItem onSelect={() => setTradeToDelete(trade)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
                  No trades found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

        <TradeDetailsDialog 
            isOpen={!!viewingTrade}
            onOpenChange={(open) => {
                if (!open) {
                    setViewingTrade(null);
                }
            }}
            trade={viewingTrade}
        />

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
