
'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAccountContext } from "@/contexts/account-context";

export function AccountSwitcher() {
    const { accounts, selectedAccountId, setSelectedAccountId, isAccountsLoaded } = useAccountContext();

    if (!isAccountsLoaded || !selectedAccountId) {
        return <div className="w-[180px] h-9 rounded-md bg-muted animate-pulse" />;
    }

    return (
        <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
                {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                        {account.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
