
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Profile</h1>
        <Card>
            <CardHeader>
                <CardTitle>Your Account</CardTitle>
                <CardDescription>Manage your account settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <p><strong>Email:</strong> {user?.email}</p>
                <p className="text-muted-foreground mt-4">More profile settings coming soon.</p>
            </CardContent>
        </Card>
    </div>
  );
}
