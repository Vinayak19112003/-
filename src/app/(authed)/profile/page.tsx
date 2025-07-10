
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import * as React from 'react';

const ProfileCard = dynamic(() => Promise.resolve(React.memo(function ProfileCard() {
    const { user } = useAuth();
    return (
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
    );
})), {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
});

export default function ProfilePage() {
  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight font-headline">Profile</h1>
        <ProfileCard />
    </div>
  );
}
