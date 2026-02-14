'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-0 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Image Search</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Book Cover or Barcode Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            {file && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Selected: {file.name}</p>
                {file.type.startsWith('image/') && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="mt-2 max-w-xs rounded-lg"
                  />
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button onClick={handleSearch} disabled={!file || loading}>
              {loading ? 'Searching...' : 'Search Books'}
            </Button>
          </div>
        </div>

        {matchedBooks.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Matched Books</h2>
            <ul className="divide-y divide-gray-200">
              {matchedBooks.map((book) => (
                <li key={book.book_id} className="py-4">
                  <Link href={`/books/${book.book_id}`} className="block hover:bg-gray-50 p-4 rounded">
                    <h3 className="text-lg font-medium text-indigo-600">{book.title}</h3>
                    <p className="text-sm text-gray-500">by {book.author}</p>
                    {book.category && (
                      <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {book.category}
                      </span>
                    )}
                    <p className="mt-2 text-sm text-gray-600">
                      Available: {book.copies_available} / {book.copies_total}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {matchedBooks.length === 0 && !loading && file && (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
            No matching books found. Try uploading a clearer image or search manually.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

