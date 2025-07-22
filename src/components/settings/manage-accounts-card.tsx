
'use client';

import { useState } from 'react';
import { useAccounts } from '@/hooks/use-accounts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { AddAccountDialog } from './add-account-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EditAccountDialog } from './edit-account-dialog';

export function ManageAccountsCard() {
    const { accounts, deleteAccount, isLoaded } = useAccounts();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (accountId: string) => {
        setIsDeleting(accountId);
        await deleteAccount(accountId);
        setIsDeleting(null);
    }

    if (!isLoaded) {
        return <Skeleton className="h-60" />;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Trading Accounts</CardTitle>
                        <CardDescription>Manage your different trading accounts.</CardDescription>
                    </div>
                    <AddAccountDialog />
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-40">
                    <div className="space-y-2">
                        {accounts.map((account: any) => (
                             <div key={account.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                <div>
                                    <span className="text-sm font-medium">{account.name}</span>
                                    <p className="text-xs text-muted-foreground">
                                        Initial Balance: ${account.initialBalance?.toLocaleString()}
                                    </p>
                                </div>
                                <div className='flex items-center'>
                                    <EditAccountDialog account={account} />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(account.id)}
                                        disabled={!!isDeleting}
                                    >
                                        {isDeleting === account.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                        <span className="sr-only">Delete {account.name}</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
