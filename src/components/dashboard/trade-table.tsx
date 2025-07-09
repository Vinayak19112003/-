
"use client";

import { useState, memo } from "react";
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type Trade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { MoreHorizontal, ImageIcon, Trash2, Edit, Eye, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StreamerModeText } from "@/components/streamer-mode-text";
import { TradeDetailsDialog } from "./trade-details-dialog";

type TradeTableProps = {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  isLoaded: boolean;
};

const ResultBadge = ({ result }: { result: Trade["result"] }) => {
    const variant = {
      Win: "success",
      Loss: "destructive",
      BE: "secondary",
      Missed: "secondary"
    }[result] as "success" | "destructive" | "secondary";
    return <Badge variant={variant}>{result}</Badge>;
};


export const TradeTable = memo(function TradeTable({ 
    trades, 
    onEdit, 
    onDelete,
    onLoadMore,
    hasMore,
    isLoading,
    isLoaded
}: TradeTableProps) {
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const isMobile = useIsMobile();

  const handleViewTrade = (trade: Trade) => {
    setViewingTrade(trade);
  };

  const handleConfirmDelete = () => {
    if (tradeToDelete) {
      onDelete(tradeToDelete.id);
      setTradeToDelete(null);
    }
  };
  
  if (!isLoaded) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  const tradeListContent = trades.length > 0 ? (
    trades.map((trade) => {
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
  );

  if (isMobile) {
    return (
        <div className="w-full space-y-4">
            <div className="space-y-4">{tradeListContent}</div>
            {hasMore && (
                <div className="flex justify-center">
                    <Button onClick={onLoadMore} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load More
                    </Button>
                </div>
            )}
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
            <TradeDetailsDialog 
                isOpen={!!viewingTrade}
                onOpenChange={(open) => !open && setViewingTrade(null)}
                trade={viewingTrade}
            />
        </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead className="text-center">RR</TableHead>
              <TableHead className="text-right">PNL ($)</TableHead>
              <TableHead className="text-right">Return %</TableHead>
              <TableHead className="text-center">Confidence</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Mistakes</TableHead>
              <TableHead className="text-center">Screenshot</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length > 0 ? (
              trades.map((trade) => {
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

        {hasMore && (
            <div className="flex justify-center py-4">
                <Button onClick={onLoadMore} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Load More
                </Button>
            </div>
        )}

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
});
