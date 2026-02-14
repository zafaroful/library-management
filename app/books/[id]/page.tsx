'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
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
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="px-4 py-6">Loading...</div>
      </DashboardLayout>
    );
  }

  if (error || !book) {
    return (
      <DashboardLayout>
        <div className="px-4 py-6 text-red-600">{error || 'Book not found'}</div>
      </DashboardLayout>
    );
  }

  const isLibrarian = ['Admin', 'Librarian'].includes((session?.user as any)?.role || '');

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0 max-w-4xl">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
              <p className="text-lg text-gray-600 mt-2">by {book.author}</p>
            </div>
            {isLibrarian && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => router.push(`/books/${params.id}/edit`)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">ISBN</dt>
              <dd className="mt-1 text-sm text-gray-900">{book.isbn || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">{book.category || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Copies</dt>
              <dd className="mt-1 text-sm text-gray-900">{book.copies_total}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Available Copies</dt>
              <dd className="mt-1 text-sm text-gray-900">{book.copies_available}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  book.availability_status === 'Available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {book.availability_status}
                </span>
              </dd>
            </div>
          </dl>

          {isLibrarian && (
            <div className="mt-6 pt-6 border-t">
              <Link href={`/loans/new?bookId=${book.book_id}`}>
                <Button>Issue Book</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

