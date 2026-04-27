'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Book, BookRecitation } from '@/lib/types/database';

export default function RecitationPage() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const role = (session?.user as { role?: string })?.role || '';
  const canManage = ['Admin', 'Librarian'].includes(role);

  const [recitations, setRecitations] = useState<
    (BookRecitation & { book?: Book })[]
  >([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [bookId, setBookId] = useState('');
  const [audioPath, setAudioPath] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recitationType, setRecitationType] = useState<'TTS' | 'Recorded'>(
    'Recorded'
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetchRecitations(searchParams.get('book_id'));
  }, [searchParams]);

  useEffect(() => {
    if (!canManage || sessionStatus !== 'authenticated') return;
    (async () => {
      try {
        const res = await fetch('/api/books?page=1&limit=500');
        const data = await res.json();
        setBooks(data.books || []);
      } catch {
        setBooks([]);
      }
    })();
  }, [canManage, sessionStatus]);

  const fetchRecitations = async (bookId?: string | null) => {
    setLoading(true);
    setListError(null);
    try {
      const query = bookId ? `?book_id=${bookId}` : '';
      const res = await fetch(`/api/recitation${query}`);
      const data = await res.json();
      if (!res.ok) {
        setListError(
          res.status === 401
            ? 'Sign in to view recitations.'
            : data.error || 'Could not load recitations.'
        );
        setRecitations([]);
        return;
      }
      setRecitations(data.recitations || []);
    } catch (error) {
      console.error('Error fetching recitations:', error);
      setListError('Could not load recitations.');
      setRecitations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);
    if (!bookId || (!audioPath.trim() && !audioFile)) {
      setFormError(
        'Choose a book and either upload an audio file (MP3, M4A, MP4) or enter an audio URL/path.'
      );
      return;
    }
    setSubmitting(true);
    try {
      let pathToSave = audioPath.trim();

      if (audioFile) {
        const form = new FormData();
        form.append('audio', audioFile);
        const uploadRes = await fetch('/api/recitation/upload', {
          method: 'POST',
          body: form,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setFormError(
            typeof uploadData.error === 'string'
              ? uploadData.error
              : 'Audio upload failed.'
          );
          return;
        }
        if (typeof uploadData.audio_file_path !== 'string') {
          setFormError('Audio upload did not return a path.');
          return;
        }
        pathToSave = uploadData.audio_file_path;
      }

      const res = await fetch('/api/recitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          audio_file_path: pathToSave,
          recitation_type: recitationType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : Array.isArray(data.error)
              ? data.error.map((i: { message?: string }) => i.message).join(', ')
              : 'Could not add recitation.';
        setFormError(msg);
        return;
      }
      setFormSuccess(true);
      setAudioPath('');
      setAudioFile(null);
      setBookId('');
      setRecitationType('Recorded');
      await fetchRecitations();
    } catch {
      setFormError('Could not add recitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Book Recitations</h1>

        <p className="text-sm text-muted-foreground max-w-3xl">
          Read and listen to library books. Librarians and admins can upload an
          MP3, M4A, or MP4 file (stored under{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            public/uploads/recitations/
          </code>
          ), or paste an external URL / path such as{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            /uploads/recitations/read-aloud.mp3
          </code>
          .
        </p>

        {canManage && sessionStatus === 'authenticated' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add recitation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRecitation} className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Book</label>
                  <Select value={bookId} onValueChange={setBookId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a book" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((b) => (
                        <SelectItem key={b.book_id} value={b.book_id}>
                          {b.title} — {b.author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {books.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No books loaded. Add books under Books first.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recitation-audio-file">Audio file (optional)</Label>
                  <input
                    id="recitation-audio-file"
                    type="file"
                    accept=".mp3,.m4a,.mp4,audio/mpeg,audio/mp3,audio/mp4,video/mp4"
                    aria-label="Recitation audio file (MP3, M4A, or MP4)"
                    className="text-muted-foreground file:bg-primary file:text-primary-foreground file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium"
                    onChange={(e) =>
                      setAudioFile(e.target.files?.[0] ?? null)
                    }
                  />
                  {audioFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {audioFile.name}
                    </p>
                  )}
                </div>
                <InputField
                  label="Audio URL or path (if not uploading a file)"
                  placeholder="https://example.com/audio.mp3 or /uploads/recitations/read-aloud.mp3"
                  value={audioPath}
                  onChange={(e) => setAudioPath(e.target.value)}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={recitationType}
                    onValueChange={(v) =>
                      setRecitationType(v as 'TTS' | 'Recorded')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recorded">Recorded</SelectItem>
                      <SelectItem value="TTS">TTS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
                {formSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Recitation added.
                  </p>
                )}
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save recitation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {listError && (
          <p className="text-sm text-destructive">{listError}</p>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : recitations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No recitations available
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recitations.map((recitation) => (
              <Card key={recitation.recitation_id} className="overflow-hidden">
                <CardHeader className="space-y-3">
                  {recitation.book?.cover_image_url ? (
                    <div className="flex justify-center">
                      <img
                        src={recitation.book.cover_image_url}
                        alt={`${recitation.book?.title || 'Book'} cover`}
                        className="h-44 w-32 rounded border object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                      No cover image
                    </div>
                  )}
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-2 text-base">
                      {recitation.book?.title || 'Unknown Book'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {recitation.book?.author || 'Unknown Author'}
                    </p>
                  </div>
                  <Badge
                    variant={
                      recitation.recitation_type === 'TTS'
                        ? 'default'
                        : 'secondary'
                    }
                    className="w-fit"
                  >
                    {recitation.recitation_type}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <audio
                    controls
                    className="w-full"
                    src={recitation.audio_file_path}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild size="sm">
                      <Link href={`/books/${recitation.book_id}`}>Read</Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/recitation?book_id=${recitation.book_id}`}>
                        Listen
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
