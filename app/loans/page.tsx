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
import { LoanWithDetails } from '@/lib/types/database';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { calculateDaysOverdue } from '@/lib/utils/date';

export default function LoansPage() {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<LoanWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/loans?${params}`);
      const data = await res.json();
      setLoans(data.loans || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: string) => {
    if (!confirm('Mark this book as returned?')) return;

    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return' }),
      });

      if (!res.ok) throw new Error('Failed to return book');
      fetchLoans();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to return');
    }
  };

  const isLibrarian = ['Admin', 'Librarian'].includes(
    (session?.user as { role?: string })?.role || ''
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          {isLibrarian && (
            <Button asChild>
              <Link href="/loans/new">Issue New Loan</Link>
            </Button>
          )}
        </div>

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
                <SelectItem value="Borrowed">Borrowed</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
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
        ) : loans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No loans found
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y">
              {loans.map((loan) => {
                const daysOverdue =
                  loan.status === 'Borrowed'
                    ? calculateDaysOverdue(loan.due_date)
                    : 0;
                const isOverdue = daysOverdue > 0;

                return (
                  <li key={loan.loan_id}>
                    <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-primary">
                          {loan.book?.title || 'Unknown Book'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          by {loan.book?.author || 'Unknown Author'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Borrower: {loan.user?.name || 'Unknown User'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Borrowed: {loan.borrow_date}</span>
                          <span>Due: {loan.due_date}</span>
                          {loan.return_date && (
                            <span>Returned: {loan.return_date}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge
                          variant={
                            loan.status === 'Returned'
                              ? 'default'
                              : isOverdue
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {loan.status}
                          {isOverdue && ` (${daysOverdue} days overdue)`}
                        </Badge>
                        {loan.status === 'Borrowed' && isLibrarian && (
                          <Button
                            size="sm"
                            onClick={() => handleReturn(loan.loan_id)}
                          >
                            Return
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
