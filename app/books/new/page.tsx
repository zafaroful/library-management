'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

export default function NewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
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
      const total = Math.max(1, parseInt(formData.copies_total, 10) || 1);
      const available = Math.max(
        0,
        Math.min(total, parseInt(formData.copies_available, 10) ?? total)
      );
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          author: formData.author.trim(),
          isbn: formData.isbn.trim() || undefined,
          category: formData.category.trim() || undefined,
          copies_total: total,
          copies_available: available,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create book');
      }

      const book = await res.json();

      if (coverFile && book?.book_id) {
        const form = new FormData();
        form.append('cover', coverFile);
        const uploadRes = await fetch(`/api/books/${book.book_id}/upload-cover`, {
          method: 'POST',
          body: form,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || 'Book created but cover upload failed');
        }
      }

      router.push('/books');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Book</h1>

        <Card>
          <CardHeader>
            <CardTitle>Book details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <InputField
                label="Title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />

              <InputField
                label="Author"
                required
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
              />

              <InputField
                label="ISBN"
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
              />

              <InputField
                label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />

              <div className="space-y-2">
                <Label htmlFor="cover">Cover image</Label>
                <input
                  id="cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="text-muted-foreground file:bg-primary file:text-primary-foreground file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
                  onChange={(e) =>
                    setCoverFile(e.target.files?.[0] ?? null)
                  }
                />
                {coverFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {coverFile.name}
                  </p>
                )}
              </div>

              <InputField
                label="Total Copies"
                type="number"
                required
                min={1}
                value={formData.copies_total}
                onChange={(e) => {
                  const total = e.target.value;
                  setFormData({
                    ...formData,
                    copies_total: total,
                    copies_available: Math.min(
                      parseInt(total, 10) || 1,
                      parseInt(formData.copies_available, 10) || 1
                    ).toString(),
                  });
                }}
              />

              <InputField
                label="Available Copies"
                type="number"
                required
                min={0}
                max={parseInt(formData.copies_total, 10) || 1}
                value={formData.copies_available}
                onChange={(e) =>
                  setFormData({ ...formData, copies_available: e.target.value })
                }
              />

              <div className="flex gap-4">
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
