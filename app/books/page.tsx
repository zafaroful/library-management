'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Book } from '@/lib/types/database';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, [page, search, category]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const res = await fetch(`/api/books?${params}`);
      const data = await res.json();
      setBooks(data.books || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      const uniqueCategories = [
        ...new Set(
          (data.books?.map((b: Book) => b.category).filter(Boolean) as string[]) || []
        ),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Books</h1>
          <Button asChild>
            <Link href="/books/new">Add New Book</Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InputField
                label="Search"
                placeholder="Search by title, author, or ISBN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Category</label>
                <Select
                  value={category || 'all'}
                  onValueChange={(v) => {
                    setCategory(v === 'all' ? '' : v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : books.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No books found
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <ul className="divide-y">
                {books.map((book) => (
                  <li key={book.book_id}>
                    <Link
                      href={`/books/${book.book_id}`}
                      className="block transition-colors hover:bg-muted/50"
                    >
                      <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-medium text-primary">
                            {book.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {book.author}
                          </p>
                          {book.category && (
                            <Badge variant="secondary" className="mt-1">
                              {book.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <p className="text-sm text-muted-foreground">
                            Available: {book.copies_available} / {book.copies_total}
                          </p>
                          <Badge
                            variant={
                              book.availability_status === 'Available'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {book.availability_status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
