-- Function to check if a user is an admin
-- Assumes a user_roles table exists linking user_id to roles
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Adjust this query based on how you store admin roles
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur -- Or potentially another table/column
    WHERE ur.user_id = user_id AND ur.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add is_suspended column to users table
ALTER TABLE public.users
ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- Enable RLS for users table if not already enabled (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict or need updating
-- Be cautious with dropping policies; ensure you know which ones exist.
-- It might be safer to ALTER existing policies if their names are known.
-- Assuming policies named 'Allow individual select access' and 'Allow individual update access' exist.
-- If these names are different, this will fail. Adjust names as needed.
DROP POLICY IF EXISTS "Allow individual select access" ON public.users;
DROP POLICY IF EXISTS "Allow individual update access" ON public.users;
DROP POLICY IF EXISTS "Allow admin update access" ON public.users; -- Drop previous admin update if exists

-- RLS Policies for users table

-- 1. Allow users to select their own data only if not suspended
CREATE POLICY "Allow individual select access (if not suspended)" ON public.users
FOR SELECT
USING (auth.uid() = id AND is_suspended = FALSE);

-- 2. Allow users to update their own data only if not suspended
CREATE POLICY "Allow individual update access (if not suspended)" ON public.users
FOR UPDATE
USING (auth.uid() = id AND is_suspended = FALSE)
WITH CHECK (auth.uid() = id AND is_suspended = FALSE);

-- 3. Allow admins to select all user data
-- Assuming an admin policy for SELECT already exists or creating a new one
-- If an "Allow admin select access" policy exists, you might alter it or ensure it doesn't conflict.
-- Example: Create if not exists or replace if logic needs change.
CREATE POLICY "Allow admin select access" ON public.users
FOR SELECT
USING (public.is_admin(auth.uid())); -- Use the is_admin function

-- 4. Allow admins to update any user's data, including the is_suspended flag
CREATE POLICY "Allow admin update access" ON public.users
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid())); -- Admins can update any field

-- Note: The is_admin function needs to be defined and correctly check user roles.
-- Ensure the is_admin function exists and works as expected.
-- Example definition (place in a previous migration or setup script):
-- CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
-- RETURNS BOOLEAN AS $$
-- BEGIN
--   RETURN EXISTS (
--     SELECT 1
--     FROM public.user_roles ur
--     WHERE ur.user_id = user_id AND ur.role = 'admin'
--   );
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
