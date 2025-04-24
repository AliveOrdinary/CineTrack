-- Update RLS policies for the users table to restrict public view
-- and explicitly allow admins to view all users.

-- 1. Alter the existing SELECT policy to only allow users to view their own profile.
--    We assume the policy name is 'Users can view all profiles' based on the screenshot.
--    Targeting 'authenticated' role instead of 'public' is generally safer.
ALTER POLICY "Users can view all profiles" ON public.users
  USING (auth.uid() = id);
ALTER POLICY "Users can view all profiles" ON public.users TO authenticated;


-- 2. Add a new SELECT policy specifically for admins.
--    This policy checks if the user making the request has the 'admin' role in the users table.
CREATE POLICY "Admins can view all user profiles" ON public.users
  FOR SELECT
  USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

-- Note: The existing UPDATE policy "Users can update their own profile" is assumed correct and remains unchanged.
-- Note: RLS is assumed to be enabled on the table already.
