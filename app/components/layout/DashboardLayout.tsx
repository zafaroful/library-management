'use client';

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Chatbot } from '@/app/components/chatbot/Chatbot';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <Chatbot />
    </div>
  );
}

