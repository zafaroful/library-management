"use client";

import Link from "next/link";
import { BookOpen, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight"
          >
            <BookOpen className="size-6 text-primary" />
            <span>Read Nest</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" asChild size="sm" className="text-sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="text-sm">
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 md:py-24 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Your library,{" "}
            <span className="text-primary">simplified</span>
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Browse, borrow, and manage books in one place. Read Nest is your cozy
            corner for reading — at readnest.app
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4 pt-2">
            <Button asChild size="lg" className="text-base">
              <Link href="/register">Create account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-16 sm:mt-20 md:mt-24 grid w-full max-w-4xl gap-6 px-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <h3 className="font-semibold">Browse & discover</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search by title, author, or category. Find your next read quickly.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="size-5" />
            </div>
            <h3 className="font-semibold">Image search</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Snap a book cover to find it in the catalog. Search the smart way.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <h3 className="font-semibold">Loans & reservations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Track borrows, due dates, and reserve titles when they’re available.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Read Nest. readnest.app
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
