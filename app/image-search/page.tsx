'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Book } from '@/lib/types/database';
import Link from 'next/link';

export default function ImageSearchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [matchedBooks, setMatchedBooks] = useState<Book[]>([]);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMatchedBooks([]);
      setError('');
    }
  };

  const handleSearch = async () => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    setLoading(true);
    setError('');
    setMatchedBooks([]);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/image-search', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to search');
      }

      const data = await res.json();
      setMatchedBooks(data.matchedBooks || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Image Search</h1>

        <Card>
          <CardHeader>
            <CardTitle>Upload Book Cover or Barcode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-upload">Image file</Label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-muted-foreground file:bg-primary file:text-primary-foreground file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
              />
            </div>

            {file && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
                {file.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="mt-2 max-w-xs rounded-lg border"
                  />
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleSearch} disabled={!file || loading}>
              {loading ? 'Searching...' : 'Search Books'}
            </Button>
          </CardContent>
        </Card>

        {matchedBooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Matched Books</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {matchedBooks.map((book) => (
                  <li key={book.book_id}>
                    <Link
                      href={`/books/${book.book_id}`}
                      className="block rounded-md p-4 transition-colors hover:bg-muted/50"
                    >
                      <h3 className="font-medium text-primary">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        by {book.author}
                      </p>
                      {book.category && (
                        <Badge variant="secondary" className="mt-1">
                          {book.category}
                        </Badge>
                      )}
                      <p className="mt-2 text-sm text-muted-foreground">
                        Available: {book.copies_available} / {book.copies_total}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {matchedBooks.length === 0 && !loading && file && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No matching books found. Try uploading a clearer image or search
              manually.
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
