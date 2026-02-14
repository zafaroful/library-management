'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { InputField } from '@/components/ui/input-field';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/lib/types/database';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    if ((session?.user as { role?: string })?.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [session, router, fetchUsers]);

  if ((session?.user as { role?: string })?.role !== 'Admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="space-y-2">
                <label
                  id="role-filter-label"
                  className="text-sm font-medium leading-none"
                >
                  Role
                </label>
                <Select
                  value={roleFilter || 'all'}
                  onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}
                >
                  <SelectTrigger aria-labelledby="role-filter-label" className="w-full">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Librarian">Librarian</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No users found
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y">
              {users.map((user) => (
                <li key={user.user_id}>
                  <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">
                          Phone: {user.phone}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <Badge
                        variant={
                          user.role === 'Admin'
                            ? 'default'
                            : user.role === 'Librarian'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
