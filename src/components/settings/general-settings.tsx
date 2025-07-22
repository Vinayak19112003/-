
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function GeneralSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                    Manage your application-wide preferences.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="currency-format">Currency Format</Label>
                        <Select defaultValue="usd">
                            <SelectTrigger id="currency-format">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usd">US Dollar - $</SelectItem>
                                <SelectItem value="cad">Canadian Dollar - $</SelectItem>
                                <SelectItem value="eur">Euro - €</SelectItem>
                                <SelectItem value="gbp">British Pound Sterling - £</SelectItem>
                                <SelectItem value="inr">Indian Rupee - ₹</SelectItem>
                                <SelectItem value="jpy">Japanese Yen - ¥</SelectItem>
                                <SelectItem value="sek">Swedish Krona - kr</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="default-order-date">Default Order Date</Label>
                        <Select defaultValue="previous">
                            <SelectTrigger id="default-order-date">
                                <SelectValue placeholder="Select default" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="previous">Previous Order Entry</SelectItem>
                                <SelectItem value="today">Today's Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="default-symbol">Default Symbol</Label>
                        <Input id="default-symbol" placeholder="e.g., EURUSD" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="default-qty">Default Qty</Label>
                        <Input id="default-qty" type="number" placeholder="e.g., 1" />
                    </div>
                </div>
                
                 <div className="flex justify-end pt-4">
                    <Button>Save Changes</Button>
                </div>
            </CardContent>
        </Card>
    );
}
