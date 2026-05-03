'use client';

import { useEffect, useState } from 'react';
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
import { InputField } from '@/components/ui/input-field';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const user = session?.user as
    | { name?: string; email?: string; role?: string; id?: string }
    | undefined;
  const isManager = ['Admin', 'Librarian'].includes(user?.role || '');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [prefTheme, setPrefTheme] = useState<'light' | 'dark'>('light');
  const [prefNotifications, setPrefNotifications] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      try {
        const res = await fetch('/api/users/me');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load profile settings');
        }
        setName(data.user?.name || '');
        setPhone(data.user?.phone || '');
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : 'Failed to load profile settings'
        );
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [status]);

  useEffect(() => {
    if (!user?.id) return;
    const raw = localStorage.getItem(`settings:${user.id}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        theme?: 'light' | 'dark';
        notifications?: boolean;
      };
      if (parsed.theme === 'light' || parsed.theme === 'dark') {
        setPrefTheme(parsed.theme);
      }
      if (typeof parsed.notifications === 'boolean') {
        setPrefNotifications(parsed.notifications);
      }
    } catch {
      // Ignore invalid local setting payload
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(
      `settings:${user.id}`,
      JSON.stringify({
        theme: prefTheme,
        notifications: prefNotifications,
      })
    );
  }, [user?.id, prefTheme, prefNotifications]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Settings updated successfully.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Account information for your Read Nest profile.
          </p>
        </div>

        {(status === 'loading' || loadingProfile) ? (
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
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Signed in as {user?.email ?? '—'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
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

                <form className="space-y-4" onSubmit={handleSaveProfile}>
                  <InputField
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <InputField
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Change password</p>
                    <InputField
                      label="Current password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <InputField
                      label="New password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <InputField
                      label="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Personal preferences saved on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <div className="space-y-2">
                  <p className="font-medium">Theme preference</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={prefTheme === 'light' ? 'default' : 'outline'}
                      onClick={() => setPrefTheme('light')}
                    >
                      Light
                    </Button>
                    <Button
                      type="button"
                      variant={prefTheme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setPrefTheme('dark')}
                    >
                      Dark
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">In-app notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Reminder messages and updates in the dashboard.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefNotifications}
                    onChange={(e) => setPrefNotifications(e.target.checked)}
                    aria-label="Toggle in-app notifications"
                  />
                </div>

                {isManager && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="font-medium">Staff tools access</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      As {user?.role}, you can manage Loans, Reservations, and Reports from
                      the sidebar. Additional system-wide policies can be added later in this
                      page.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
