'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

export default function NewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    copies_total: '1',
    copies_available: '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          copies_total: parseInt(formData.copies_total),
          copies_available: parseInt(formData.copies_available),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create book');
      }

      router.push('/books');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Book</h1>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Input
            label="Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <Input
            label="Author"
            required
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          />

          <Input
            label="ISBN"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
          />

          <Input
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />

          <Input
            label="Total Copies"
            type="number"
            required
            min="1"
            value={formData.copies_total}
            onChange={(e) => {
              const total = e.target.value;
              setFormData({
                ...formData,
                copies_total: total,
                copies_available: Math.min(parseInt(total) || 1, parseInt(formData.copies_available) || 1).toString(),
              });
            }}
          />

          <Input
            label="Available Copies"
            type="number"
            required
            min="0"
            max={formData.copies_total}
            value={formData.copies_available}
            onChange={(e) => setFormData({ ...formData, copies_available: e.target.value })}
          />

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Book'}
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

