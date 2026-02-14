import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  "";

/** Server-side Supabase client for Storage (and optional Auth). Use in API routes. */
export const supabase = createClient(supabaseUrl, supabaseKey);

/** Storage bucket name for book cover images */
export const BOOK_COVER_BUCKET = "book";
