-- Fix notifications table to reference public.users instead of auth.users
-- This ensures consistency with our user management system

-- Drop the existing foreign key constraint that references auth.users
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Add the correct foreign key constraint referencing public.users
ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Clear any existing notifications that might have invalid user_id references
DELETE FROM notifications;

-- Add comment to document the fix
COMMENT ON CONSTRAINT notifications_user_id_fkey ON notifications IS 
'Foreign key constraint referencing public.users table for consistency with user management system'; 