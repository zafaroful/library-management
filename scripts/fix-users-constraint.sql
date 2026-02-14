-- Fix users table foreign key constraint
-- This removes the old Supabase Auth foreign key reference

-- Drop the foreign key constraint if it exists
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_user_id_fkey;

-- Ensure user_id has a default value
ALTER TABLE public.users 
ALTER COLUMN user_id SET DEFAULT uuid_generate_v4();

-- Make sure password_hash is NOT NULL (if it isn't already)
ALTER TABLE public.users 
ALTER COLUMN password_hash SET NOT NULL;

