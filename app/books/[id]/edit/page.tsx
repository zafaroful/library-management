'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Book } from '@/lib/types/database';

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    description: '',
    pages: '',
    publication_year: '',
    copies_total: '1',
    copies_available: '1',
  });

  useEffect(() => {
    if (params.id) fetchBook();
  }, [params.id]);

  const fetchBook = async () => {
    try {
      const res = await fetch(`/api/books/${params.id}`);
      if (!res.ok) throw new Error('Book not found');
      const book: Book = await res.json();
      setCurrentCoverUrl(book.cover_image_url ?? null);
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn ?? '',
        category: book.category ?? '',
        description: book.description ?? '',
        pages: book.pages != null ? String(book.pages) : '',
        publication_year: book.publication_year != null ? String(book.publication_year) : '',
        copies_total: String(book.copies_total),
        copies_available: String(book.copies_available),
      });
    } catch {
      setError('Book not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn || undefined,
        category: formData.category || undefined,
        description: formData.description || undefined,
        pages: formData.pages ? parseInt(formData.pages, 10) : undefined,
        publication_year: formData.publication_year
          ? parseInt(formData.publication_year, 10)
          : undefined,
        copies_total: parseInt(formData.copies_total, 10),
        copies_available: parseInt(formData.copies_available, 10),
      };

      const res = await fetch(`/api/books/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update book');
      }

      if (coverFile) {
        const form = new FormData();
        form.append('cover', coverFile);
        const uploadRes = await fetch(`/api/books/${params.id}/upload-cover`, {
          method: 'POST',
          body: form,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || 'Book updated but cover upload failed');
        }
      }

      router.push(`/books/${params.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update book');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !formData.title) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>

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
                <div className="flex flex-wrap items-start gap-4">
                  {currentCoverUrl && (
                    <div className="shrink-0">
                      <p className="mb-1 text-sm text-muted-foreground">
                        Current cover
                      </p>
                      <img
                        src={currentCoverUrl}
                        alt="Current cover"
                        className="h-32 w-24 rounded border object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <input
                      id="cover"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      aria-label="Cover image"
                      className="text-muted-foreground file:bg-primary file:text-primary-foreground file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
                      onChange={(e) =>
                        setCoverFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {coverFile && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        New file: {coverFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <InputField
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />

              <InputField
                label="Pages"
                type="number"
                min={1}
                value={formData.pages}
                onChange={(e) =>
                  setFormData({ ...formData, pages: e.target.value })
                }
              />

              <InputField
                label="Publication year"
                type="number"
                min={1000}
                max={2100}
                value={formData.publication_year}
                onChange={(e) =>
                  setFormData({ ...formData, publication_year: e.target.value })
                }
              />

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
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/books/${params.id}`)}
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
