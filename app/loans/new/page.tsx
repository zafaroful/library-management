'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

function NewLoanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [books, setBooks] = useState<{ book_id: string; title: string; author: string; copies_available: number }[]>([]);
  const [users, setUsers] = useState<{ user_id: string; name: string; email: string }[]>([]);
  const [formData, setFormData] = useState({
    book_id: searchParams.get('bookId') || '',
    user_id: '',
    borrow_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  const availableBooks = books.filter((book) => book.copies_available > 0);

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Issue New Loan</h1>

        <Card>
          <CardHeader>
            <CardTitle>Loan details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Book</Label>
                <Select
                  required
                  value={formData.book_id || undefined}
                  onValueChange={(v) =>
                    setFormData({ ...formData, book_id: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBooks.map((book) => (
                      <SelectItem key={book.book_id} value={book.book_id}>
                        {book.title} by {book.author} ({book.copies_available}{' '}
                        available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  required
                  value={formData.user_id || undefined}
                  onValueChange={(v) =>
                    setFormData({ ...formData, user_id: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <InputField
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

              <InputField
                label="Due Date"
                type="date"
                required
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />

              <div className="flex gap-4">
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function NewLoanPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="max-w-2xl space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DashboardLayout>
      }
    >
      <NewLoanForm />
    </Suspense>
  );
}
