-- Grant admins permission to update user roles.
CREATE POLICY "Admins can update user roles" ON public.users
  FOR UPDATE
  USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' )
  WITH CHECK ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );
