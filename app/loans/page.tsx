'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
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
    } catch (error: any) {
      alert(error.message);
    }
  };

  const isLibrarian = ['Admin', 'Librarian'].includes((session?.user as any)?.role || '');

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Loans</h1>
          {isLibrarian && (
            <Link href="/loans/new">
              <Button>Issue New Loan</Button>
            </Link>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <select
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Borrowed">Borrowed</option>
            <option value="Returned">Returned</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : loans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No loans found</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {loans.map((loan) => {
                const daysOverdue = loan.status === 'Borrowed' ? calculateDaysOverdue(loan.due_date) : 0;
                const isOverdue = daysOverdue > 0;

                return (
                  <li key={loan.loan_id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-indigo-600">
                            {loan.book?.title || 'Unknown Book'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            by {loan.book?.author || 'Unknown Author'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            Borrower: {loan.user?.name || 'Unknown User'}
                          </p>
                          <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                            <span>Borrowed: {loan.borrow_date}</span>
                            <span>Due: {loan.due_date}</span>
                            {loan.return_date && <span>Returned: {loan.return_date}</span>}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            loan.status === 'Borrowed'
                              ? isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {loan.status}
                            {isOverdue && ` (${daysOverdue} days overdue)`}
                          </span>
                          {loan.status === 'Borrowed' && isLibrarian && (
                            <div className="mt-2">
                              <Button
                                variant="primary"
                                onClick={() => handleReturn(loan.loan_id)}
                              >
                                Return
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

