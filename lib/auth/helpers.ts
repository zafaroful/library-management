import { auth } from './config';

export async function getServerSession() {
  return await auth();
}

export function getUserRole(session: any): string | null {
  return (session?.user as any)?.role || null;
}

export function isAdmin(session: any): boolean {
  return getUserRole(session) === 'Admin';
}

export function isLibrarian(session: any): boolean {
  const role = getUserRole(session);
  return role === 'Admin' || role === 'Librarian';
}

