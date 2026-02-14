"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Book, LoanWithDetails } from "@/lib/types/database";
import {
  Search,
  MoreHorizontal,
  Share2,
  BookOpen,
  Star,
  Heart,
} from "lucide-react";

const CATEGORY_TABS = [
  { label: "Populer", value: "" },
  { label: "Business", value: "Business" },
  { label: "Self Improvement", value: "Self Improvement" },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

function BookPlaceholder() {
  return (
    <div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
      <BookOpen className="size-8" />
    </div>
  );
}

export function DashboardDiscover() {
  const { data: session } = useSession();
  const [categoryTab, setCategoryTab] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [yourBooks, setYourBooks] = useState<LoanWithDetails[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingYourBooks, setLoadingYourBooks] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);

  const fetchPopular = useCallback(async () => {
    setLoadingPopular(true);
    try {
      const params = new URLSearchParams({ limit: "10" });
      if (categoryTab) params.set("category", categoryTab);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/books?${params}`);
      const data = await res.json();
      setPopularBooks(data.books ?? []);
    } catch {
      setPopularBooks([]);
    } finally {
      setLoadingPopular(false);
    }
  }, [categoryTab, debouncedSearch]);

  const fetchYourBooks = useCallback(async () => {
    setLoadingYourBooks(true);
    try {
      const res = await fetch("/api/loans?status=Borrowed");
      const data = await res.json();
      setYourBooks(data.loans ?? []);
    } catch {
      setYourBooks([]);
    } finally {
      setLoadingYourBooks(false);
    }
  }, []);

  useEffect(() => {
    fetchPopular();
  }, [fetchPopular]);

  useEffect(() => {
    fetchYourBooks();
  }, [fetchYourBooks]);

  const openBookDrawer = (book: Book) => {
    setSelectedBook(book);
    setDrawerOpen(true);
  };

  const alreadyBorrowed =
    selectedBook &&
    yourBooks.some((loan) => loan.book?.book_id === selectedBook.book_id);

  const handleBorrow = async () => {
    if (!selectedBook || !session?.user) return;
    const userId = (session.user as { id?: string })?.id;
    if (!userId) return;
    setBorrowLoading(true);
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_id: selectedBook.book_id,
          user_id: userId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to borrow");
      }
      setDrawerOpen(false);
      setSelectedBook(null);
      fetchYourBooks();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to borrow");
    } finally {
      setBorrowLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Tabs + Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 border-b">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => setCategoryTab(tab.value)}
                className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  categoryTab === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search for title, author, tags, etc."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Popular section */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Popular</h2>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4">
              {loadingPopular ? (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-52 w-28 shrink-0 animate-pulse rounded-lg bg-muted"
                  />
                ))
              ) : popularBooks.length === 0 ? (
                <p className="py-8 text-muted-foreground">No books found</p>
              ) : (
                popularBooks.map((book) => (
                  <button
                    key={book.book_id}
                    type="button"
                    onClick={() => openBookDrawer(book)}
                    className="flex w-28 shrink-0 flex-col items-center gap-2 text-left transition-opacity hover:opacity-90"
                  >
                    {book.cover_image_url ? (
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="h-40 w-28 rounded-lg border object-cover"
                      />
                    ) : (
                      <BookPlaceholder />
                    )}
                    <span className="line-clamp-2 w-full text-sm font-medium">
                      {book.title}
                    </span>
                    <span className="line-clamp-1 w-full text-xs text-muted-foreground">
                      {book.author}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Your Books section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Books</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sort by :</span>
              <span className="font-medium text-foreground">Date</span>
            </div>
          </div>
          <div className="space-y-3">
            {loadingYourBooks ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 w-full animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : yourBooks.length === 0 ? (
              <p className="py-6 text-muted-foreground">
                You have no borrowed books
              </p>
            ) : (
              yourBooks.map((loan) => {
                const book = loan.book;
                if (!book) return null;
                return (
                  <div
                    key={loan.loan_id}
                    className="flex items-center gap-4 rounded-lg border bg-card p-3"
                  >
                    <button
                      type="button"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openBookDrawer(book)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="h-14 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-muted">
                          <BookOpen className="size-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{book.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {book.author}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {book.pages ?? "—"} Pages
                        </p>
                      </div>
                    </button>
                    <div className="w-24 shrink-0">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-1/2 bg-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">50%</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" className="text-primary">
                        Share
                      </Button>
                      <Button size="sm">Read Book</Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Book Details drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-md"
          showCloseButton={true}
        >
          {selectedBook && (
            <>
              <SheetHeader>
                <SheetTitle>Book Details</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 pt-4">
                {selectedBook.cover_image_url ? (
                  <img
                    src={selectedBook.cover_image_url}
                    alt={selectedBook.title}
                    className="mx-auto h-56 w-40 rounded-lg border object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-56 w-40 items-center justify-center rounded-lg border bg-muted">
                    <BookOpen className="size-12 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedBook.title}</h3>
                  <p className="text-muted-foreground">{selectedBook.author}</p>
                </div>
                <div className="flex gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="size-5 fill-current"
                      style={{ opacity: i <= 4 ? 1 : 0.3 }}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>{selectedBook.pages ?? "—"} Pages</span>
                  <span>
                    {selectedBook.publication_year
                      ? `${selectedBook.publication_year} Release`
                      : "—"}
                  </span>
                  <span>— Readers</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedBook.description ||
                    "No description available for this book."}
                </p>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleBorrow}
                    disabled={
                      borrowLoading ||
                      (selectedBook.copies_available ?? 0) <= 0 ||
                      !!alreadyBorrowed
                    }
                  >
                    {borrowLoading
                      ? "Borrowing..."
                      : alreadyBorrowed
                        ? "Already borrowed"
                        : "Borrow"}
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Add to wishlist">
                    <Heart className="size-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
