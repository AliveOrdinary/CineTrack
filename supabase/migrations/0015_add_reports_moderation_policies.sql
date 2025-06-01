-- Add RLS policies for moderators and admins to access all reports
-- This enables the moderation dashboard functionality

-- Allow moderators and admins to view all reports (not just their own)
CREATE POLICY "Moderators and admins can view all reports"
ON reports
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('moderator', 'admin')
  )
);

-- Allow moderators and admins to update reports (for moderation actions)
CREATE POLICY "Moderators and admins can update reports"
ON reports
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('moderator', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('moderator', 'admin')
  )
);

-- Allow moderators and admins to delete reports if necessary
CREATE POLICY "Moderators and admins can delete reports"
ON reports
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('moderator', 'admin')
  )
);

-- Add comments to document the policies
COMMENT ON POLICY "Moderators and admins can view all reports" ON reports IS 
'Enables moderation dashboard by allowing moderators and admins to view all reports';

COMMENT ON POLICY "Moderators and admins can update reports" ON reports IS 
'Allows moderators and admins to resolve, dismiss, or update report status and notes';

COMMENT ON POLICY "Moderators and admins can delete reports" ON reports IS 
'Allows moderators and admins to delete reports if needed for moderation purposes'; 