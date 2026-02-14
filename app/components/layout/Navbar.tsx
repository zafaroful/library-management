'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  if (!session) return null;

  const isAdmin = (session.user as any)?.role === 'Admin';
  const isLibrarian = ['Admin', 'Librarian'].includes((session.user as any)?.role || '');

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex items-center px-2 py-2 text-xl font-bold text-indigo-600">
              Library Management
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                Dashboard
              </Link>
              <Link href="/books" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                Books
              </Link>
              {isLibrarian && (
                <>
                  <Link href="/loans" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                    Loans
                  </Link>
                  <Link href="/reservations" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                    Reservations
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link href="/admin/users" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                  Users
                </Link>
              )}
              <Link href="/reports" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                Reports
              </Link>
              <Link href="/fines" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                Fines
              </Link>
              <Link href="/image-search" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                Image Search
              </Link>
              <Link href="/recitation" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600">
                Recitations
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{session.user?.name}</span>
            <span className="text-xs text-gray-500">({(session.user as any)?.role})</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-700 hover:text-indigo-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

