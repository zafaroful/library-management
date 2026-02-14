'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Book } from '@/lib/types/database';
import { useSession } from 'next-auth/react';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchBook();
    }
  }, [params.id]);

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/books/${params.id}`);
      if (!res.ok) throw new Error('Book not found');
      const data = await res.json();
      setBook(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Book not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const res = await fetch(`/api/books/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete book');
      router.push('/books');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !book) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Book not found'}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  const isLibrarian = ['Admin', 'Librarian'].includes(
    (session?.user as { role?: string })?.role || ''
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
              <p className="mt-2 text-lg text-muted-foreground">by {book.author}</p>
            </div>
            {isLibrarian && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/books/${params.id}/edit`)}
                >
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">ISBN</dt>
                <dd className="mt-1 text-sm">{book.isbn || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Category</dt>
                <dd className="mt-1 text-sm">{book.category || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Total Copies</dt>
                <dd className="mt-1 text-sm">{book.copies_total}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Available Copies</dt>
                <dd className="mt-1 text-sm">{book.copies_available}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      book.availability_status === 'Available' ? 'default' : 'destructive'
                    }
                  >
                    {book.availability_status}
                  </Badge>
                </dd>
              </div>
            </dl>

            {isLibrarian && (
              <div className="border-t pt-6">
                <Button asChild>
                  <Link href={`/loans/new?bookId=${book.book_id}`}>Issue Book</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
