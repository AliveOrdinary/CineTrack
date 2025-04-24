-- Remove the complex is_admin function definition as we'll check the role directly
-- Drop the function if it exists from a previous run (idempotent)
DROP FUNCTION IF EXISTS public.is_admin(user_id UUID);

-- Function to check if the current user is an admin (SECURITY DEFINER)
-- SECURITY DEFINER allows the function to bypass RLS for the query inside it.
-- It runs with the privileges of the user who defined the function.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check directly in the users table for the role of the authenticated user
  RETURN EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (necessary for RLS policies)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Add is_suspended column to users table (keep this)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE; -- Use IF NOT EXISTS for idempotency

-- Enable RLS for users table if not already enabled (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting old policies (keep this, adjust names if needed)
-- Ensure these names accurately reflect the policies you intend to replace.
DROP POLICY IF EXISTS "Allow individual select access" ON public.users;
DROP POLICY IF EXISTS "Allow individual update access" ON public.users;
DROP POLICY IF EXISTS "Allow admin select access" ON public.users; -- Drop old admin select policy
DROP POLICY IF EXISTS "Allow admin update access" ON public.users; -- Drop old admin update policy

-- RLS Policies for users table

-- 1. Allow users to select their own data only if not suspended (Keep this)
CREATE POLICY "Allow individual select access (if not suspended)" ON public.users
FOR SELECT
USING (auth.uid() = id AND is_suspended = FALSE);

-- 2. Allow users to update their own data only if not suspended (Keep this)
CREATE POLICY "Allow individual update access (if not suspended)" ON public.users
FOR UPDATE
USING (auth.uid() = id AND is_suspended = FALSE)
WITH CHECK (auth.uid() = id AND is_suspended = FALSE);

-- 3. Allow admins to select all user data (Using the function)
CREATE POLICY "Allow admin select access v2" ON public.users
FOR SELECT
USING (public.is_admin()); -- Use the security definer function

-- 4. Allow admins to update any user's data... (Using the function)
CREATE POLICY "Allow admin update access v2" ON public.users
FOR UPDATE
USING (public.is_admin()) -- Use the security definer function
WITH CHECK (public.is_admin()); -- Use the security definer function

-- Note: The logic now uses a SECURITY DEFINER function to check the role.
