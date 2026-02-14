'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
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
import { useSession } from 'next-auth/react';

interface FineWithDetails {
  fine_id: string;
  loan_id: string;
  amount: number;
  payment_status: string;
  loan?: {
    loan_id: string;
    book?: { title: string; author: string };
    user?: { name: string; email: string };
    due_date: string;
  };
}

export default function FinesPage() {
  const { data: session } = useSession();
  const [fines, setFines] = useState<FineWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchFines();
  }, [statusFilter]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('payment_status', statusFilter);

      const res = await fetch(`/api/fines?${params}`);
      const data = await res.json();
      setFines(data.fines || []);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (fineId: string) => {
    if (!confirm('Mark this fine as paid?')) return;

    try {
      const res = await fetch(`/api/fines/${fineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'Paid' }),
      });

      if (!res.ok) throw new Error('Failed to update fine');
      fetchFines();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to update fine');
    }
  };

  const isLibrarian = ['Admin', 'Librarian'].includes(
    (session?.user as { role?: string })?.role || ''
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Fines</h1>

        <Card>
          <CardContent className="pt-6">
            <Select
              value={statusFilter || 'all'}
              onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : fines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No fines found
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y">
              {fines.map((fine) => (
                <li key={fine.fine_id}>
                  <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">
                        {fine.loan?.book?.title || 'Unknown Book'}
                      </h3>
                      {isLibrarian && (
                        <p className="text-sm text-muted-foreground">
                          Borrower: {fine.loan?.user?.name || 'Unknown User'}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Due Date: {fine.loan?.due_date || 'N/A'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="text-lg font-semibold">
                        ${fine.amount.toFixed(2)}
                      </p>
                      <Badge
                        variant={
                          fine.payment_status === 'Paid' ? 'default' : 'destructive'
                        }
                      >
                        {fine.payment_status}
                      </Badge>
                      {fine.payment_status === 'Unpaid' && (
                        <Button
                          size="sm"
                          onClick={() => handlePayFine(fine.fine_id)}
                        >
                          Mark as Paid
                        </Button>
                      )}
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
