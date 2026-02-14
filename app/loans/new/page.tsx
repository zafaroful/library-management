'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

function NewLoanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    book_id: searchParams.get('bookId') || '',
    user_id: '',
    borrow_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchBooks();
    fetchUsers();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books?limit=1000');
      const data = await res.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create loan');
      }

      router.push('/loans');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Issue New Loan</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
            <select
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={formData.book_id}
              onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
            >
              <option value="">Select a book</option>
              {books
                .filter((book) => book.copies_available > 0)
                .map((book) => (
                  <option key={book.book_id} value={book.book_id}>
                    {book.title} by {book.author} ({book.copies_available} available)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Borrow Date"
            type="date"
            required
            value={formData.borrow_date}
            onChange={(e) => {
              const borrowDate = new Date(e.target.value);
              const dueDate = new Date(borrowDate);
              dueDate.setDate(dueDate.getDate() + 14);
              setFormData({
                ...formData,
                borrow_date: e.target.value,
                due_date: dueDate.toISOString().split('T')[0],
              });
            }}
          />

          <Input
            label="Due Date"
            type="date"
            required
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Issue Loan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function NewLoanPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="px-4 py-6 sm:px-0 max-w-2xl">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-48 mb-6" />
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </DashboardLayout>
    }>
      <NewLoanForm />
    </Suspense>
  );
}

