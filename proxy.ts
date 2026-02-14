
import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const token = req.auth;
  const path = req.nextUrl.pathname;

  // Admin routes
  if (path.startsWith('/admin') && (token?.user as any)?.role !== 'Admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Librarian routes
  if (path.startsWith('/librarian') && !['Admin', 'Librarian'].includes((token?.user as any)?.role as string)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/librarian/:path*', '/dashboard/:path*', '/api/:path*'],
};

