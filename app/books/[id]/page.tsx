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
import { Book, BookRecitation } from '@/lib/types/database';
import { useSession } from 'next-auth/react';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [book, setBook] = useState<Book | null>(null);
  const [recitations, setRecitations] = useState<(BookRecitation & { book?: Book })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [recitationLoading, setRecitationLoading] = useState(true);
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

  const fetchRecitations = async (bookId: string) => {
    setRecitationLoading(true);
    try {
      const res = await fetch(`/api/recitation?book_id=${bookId}`);
      const data = await res.json();
      if (!res.ok) {
        setRecitations([]);
        return;
      }
      setRecitations(data.recitations || []);
    } catch {
      setRecitations([]);
    } finally {
      setRecitationLoading(false);
    }
  };

  useEffect(() => {
    if (book?.book_id) {
      fetchRecitations(book.book_id);
    }
  }, [book?.book_id]);

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
            {book.cover_image_url && (
              <div className="flex justify-start">
                <img
                  src={book.cover_image_url}
                  alt={`${book.title} cover`}
                  className="h-48 w-32 rounded border object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:max-w-sm sm:grid-cols-2">
              <Button asChild>
                <Link href={`/books/${book.book_id}`}>Read</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={`/recitation?book_id=${book.book_id}`}>Listen</Link>
              </Button>
            </div>

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
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Pages</dt>
                <dd className="mt-1 text-sm">
                  {book.pages != null ? book.pages : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Publication Year
                </dt>
                <dd className="mt-1 text-sm">
                  {book.publication_year != null ? book.publication_year : 'N/A'}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">
                {book.description || 'N/A'}
              </p>
            </div>

            <div className="space-y-3 border-t pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Available audio recitations
              </p>
              {recitationLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : recitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No audio recitation is available for this book yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recitations.slice(0, 2).map((recitation) => (
                    <div
                      key={recitation.recitation_id}
                      className="rounded-md border p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Badge
                          variant={
                            recitation.recitation_type === 'TTS'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {recitation.recitation_type}
                        </Badge>
                      </div>
                      <audio
                        controls
                        className="w-full"
                        src={recitation.audio_file_path}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  ))}
                  {recitations.length > 2 && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/recitation?book_id=${book.book_id}`}>
                        View all {recitations.length} recitations
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>

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
