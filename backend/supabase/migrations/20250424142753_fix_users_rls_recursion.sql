-- Drop potentially problematic policies first
DROP POLICY IF EXISTS "Allow individual select access (if not suspended)" ON public.users;
DROP POLICY IF EXISTS "Allow admin select access" ON public.users;
DROP POLICY IF EXISTS "Allow individual update access (if not suspended)" ON public.users;
DROP POLICY IF EXISTS "Allow admin update access" ON public.users;

-- 1. Allow users to select their own data OR allow admins to select any data
--    Combine self-select (non-suspended) and admin select logic
CREATE POLICY "Allow select access" ON public.users
FOR SELECT
USING (
  -- Allow users to select their own profile if not suspended
  (auth.uid() = id AND is_suspended = FALSE)
  OR
  -- Allow users whose role is 'admin' (checked directly on the row) to select any profile
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- 2. Allow users to update their own data OR allow admins to update any data
--    Combine self-update (non-suspended) and admin update logic
CREATE POLICY "Allow update access" ON public.users
FOR UPDATE
USING (
  -- Allow users to update their own profile if not suspended
  (auth.uid() = id AND is_suspended = FALSE)
  OR
  -- Allow users whose role is 'admin' (checked directly on the row) to update any profile
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  -- Check applies to both user self-updates and admin updates
  (auth.uid() = id AND is_suspended = FALSE)
  OR
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Important: If you still need the is_admin() function elsewhere,
-- ensure it doesn't query the users table or use SECURITY DEFINER cautiously.
-- For RLS, checking the role directly within the policy using a subquery
-- like (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
-- avoids the recursion when the policy is evaluated for the auth.uid() user.