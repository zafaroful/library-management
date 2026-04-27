'use client';

import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const user = session?.user as
    | { name?: string; email?: string; role?: string }
    | undefined;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Account information for your Read Nest profile.
          </p>
        </div>

        {status === 'loading' ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full max-w-md mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Signed in as {user?.email ?? '—'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{user?.name ?? '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Role</span>
                <div>
                  {user?.role ? (
                    <Badge variant="secondary">{user.role}</Badge>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
