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

  const handleStatusChange = async (
    reservationId: string,
    newStatus: string
  ) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update reservation');
      fetchReservations();
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : 'Failed to update reservation'
      );
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
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : 'Failed to cancel reservation'
      );
    }
  };

  const isLibrarian = ['Admin', 'Librarian'].includes(
    (session?.user as { role?: string })?.role || ''
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Reservations</h1>

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
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Collected">Collected</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
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
        ) : reservations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No reservations found
            </CardContent>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y">
              {reservations.map((reservation) => (
                <li key={reservation.reservation_id}>
                  <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-primary">
                        {reservation.book?.title || 'Unknown Book'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {reservation.book?.author || 'Unknown Author'}
                      </p>
                      {isLibrarian && (
                        <p className="text-sm text-muted-foreground">
                          Reserved by: {reservation.user?.name || 'Unknown User'}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Reserved on: {reservation.reservation_date}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge
                        variant={
                          reservation.status === 'Collected'
                            ? 'default'
                            : reservation.status === 'Pending'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {reservation.status}
                      </Badge>
                      <div className="flex gap-2">
                        {reservation.status === 'Pending' && isLibrarian && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(
                                reservation.reservation_id,
                                'Collected'
                              )
                            }
                          >
                            Mark Collected
                          </Button>
                        )}
                        {reservation.status === 'Pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleCancel(reservation.reservation_id)
                            }
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
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
