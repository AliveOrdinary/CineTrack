-- Create avatar storage bucket and RLS policies
-- This enables user avatar upload functionality

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view all avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add comments to document the bucket and policies
COMMENT ON POLICY "Users can upload their own avatars" ON storage.objects IS 
'Allows users to upload avatar images to their own folder (userId/filename)';

COMMENT ON POLICY "Anyone can view avatars" ON storage.objects IS 
'Allows public access to view all avatar images since they are profile pictures';

COMMENT ON POLICY "Users can update their own avatars" ON storage.objects IS 
'Allows users to update/replace their existing avatar images';

COMMENT ON POLICY "Users can delete their own avatars" ON storage.objects IS 
'Allows users to delete their own avatar images when changing or removing avatars'; 