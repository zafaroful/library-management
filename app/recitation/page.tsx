'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookRecitation } from '@/lib/types/database';

export default function RecitationPage() {
  const [recitations, setRecitations] = useState<
    (BookRecitation & { book?: { title?: string; author?: string } })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecitations();
  }, []);

  const fetchRecitations = async () => {
    try {
      const res = await fetch('/api/recitation');
      const data = await res.json();
      setRecitations(data.recitations || []);
    } catch (error) {
      console.error('Error fetching recitations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Book Recitations</h1>

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
          <Card>
            <ul className="divide-y">
              {recitations.map((recitation) => (
                <li key={recitation.recitation_id}>
                  <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-primary">
                        {recitation.book?.title || 'Unknown Book'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {recitation.book?.author || 'Unknown Author'}
                      </p>
                      <Badge
                        variant={
                          recitation.recitation_type === 'TTS'
                            ? 'default'
                            : 'secondary'
                        }
                        className="mt-2"
                      >
                        {recitation.recitation_type}
                      </Badge>
                    </div>
                    <div className="shrink-0">
                      <audio controls className="w-64">
                        <source
                          src={recitation.audio_file_path}
                          type="audio/mpeg"
                        />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
