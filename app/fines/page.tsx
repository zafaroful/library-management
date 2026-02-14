'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
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
    } catch (error: any) {
      alert(error.message);
    }
  };

  const isLibrarian = ['Admin', 'Librarian'].includes((session?.user as any)?.role || '');

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Fines</h1>

        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <select
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : fines.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No fines found</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {fines.map((fine) => (
                <li key={fine.fine_id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {fine.loan?.book?.title || 'Unknown Book'}
                        </h3>
                        {isLibrarian && (
                          <p className="mt-1 text-sm text-gray-500">
                            Borrower: {fine.loan?.user?.name || 'Unknown User'}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Due Date: {fine.loan?.due_date || 'N/A'}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-semibold text-gray-900">${fine.amount.toFixed(2)}</p>
                        <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          fine.payment_status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fine.payment_status}
                        </span>
                        {fine.payment_status === 'Unpaid' && (
                          <div className="mt-2">
                            <Button
                              variant="primary"
                              onClick={() => handlePayFine(fine.fine_id)}
                            >
                              Mark as Paid
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

