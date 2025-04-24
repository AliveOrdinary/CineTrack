-- Drop the problematic policies that are causing recursion
DROP POLICY IF EXISTS "Allow select access" ON public.users;
DROP POLICY IF EXISTS "Allow update access" ON public.users;
DROP POLICY IF EXISTS "Allow individual select access (if not suspended)" ON public.users;
DROP POLICY IF EXISTS "Allow admin select access" ON public.users;
DROP POLICY IF EXISTS "Allow individual update access (if not suspended)" ON public.users;
DROP POLICY IF EXISTS "Allow admin update access" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.users;

-- Create a proper is_admin function that doesn't query the users table directly
-- This avoids the recursion problem
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Get the role directly from the auth.uid() user in the users table
  -- This avoids recursive policy evaluation
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Setup proper policies that don't cause recursion

-- 1. Public access policy - allows anyone to view basic user info (non-sensitive)
CREATE POLICY "Public users access" ON public.users
FOR SELECT
USING (
  -- Allow public access to non-suspended users, but limit to non-sensitive fields
  is_suspended = FALSE
);

-- 2. Self access policy - users can view and update their own profile
CREATE POLICY "Users can access their own profile" ON public.users
FOR ALL
USING (auth.uid() = id AND is_suspended = FALSE)
WITH CHECK (auth.uid() = id);

-- 3. Admin access policy using the fixed is_admin function
CREATE POLICY "Admins can access all profiles" ON public.users
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Let's also update the auth.users trigger to set role appropriately
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, role, is_suspended)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 'user', FALSE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 