// This file is deprecated - use @/lib/db instead
// Kept for backwards compatibility during migration
export { db } from "@/lib/db";

// Alias for createServerClient
export async function createServerClient() {
  return (await import("@/lib/db")).db;
}
