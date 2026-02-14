'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/app/components/layout/DashboardLayout';
import { Button } from '@/app/components/ui/Button';
import { BookRecitation } from '@/lib/types/database';
import Link from 'next/link';

export default function RecitationPage() {
  const [recitations, setRecitations] = useState<(BookRecitation & { book?: any })[]>([]);
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
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Book Recitations</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : recitations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No recitations available</div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {recitations.map((recitation) => (
                <li key={recitation.recitation_id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-indigo-600">
                          {recitation.book?.title || 'Unknown Book'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          by {recitation.book?.author || 'Unknown Author'}
                        </p>
                        <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          recitation.recitation_type === 'TTS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {recitation.recitation_type}
                        </span>
                      </div>
                      <div className="ml-4">
                        <audio controls className="w-64">
                          <source src={recitation.audio_file_path} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

