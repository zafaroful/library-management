'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
import { ReservationWithDetails } from '@/lib/types/database';
import { useSession } from 'next-auth/react';

export default function ReservationsPage() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/reservations?${params}`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update reservation');
      fetchReservations();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Cancel this reservation?')) return;

    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to cancel reservation');
      fetchReservations();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const isLibrarian = ['Admin', 'Librarian'].includes((session?.user as any)?.role || '');

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reservations</h1>

        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <select
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Collected">Collected</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No reservations found</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <li key={reservation.reservation_id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-indigo-600">
                          {reservation.book?.title || 'Unknown Book'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          by {reservation.book?.author || 'Unknown Author'}
                        </p>
                        {isLibrarian && (
                          <p className="mt-1 text-sm text-gray-500">
                            Reserved by: {reservation.user?.name || 'Unknown User'}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Reserved on: {reservation.reservation_date}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reservation.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : reservation.status === 'Collected'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.status}
                        </span>
                        <div className="mt-2 flex space-x-2">
                          {reservation.status === 'Pending' && isLibrarian && (
                            <Button
                              variant="primary"
                              onClick={() => handleStatusChange(reservation.reservation_id, 'Collected')}
                            >
                              Mark Collected
                            </Button>
                          )}
                          {reservation.status === 'Pending' && (
                            <Button
                              variant="danger"
                              onClick={() => handleCancel(reservation.reservation_id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
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

