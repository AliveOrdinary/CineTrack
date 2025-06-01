-- Migration for creating the users table

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Should reference auth.users.id
  email TEXT UNIQUE NOT NULL, -- Potentially retrieved from auth.users
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  region TEXT DEFAULT 'US',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')), -- Ensure this matches tech reqs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on role for admin queries
CREATE INDEX idx_users_role ON users(role);

-- Optional: Add a trigger to sync with auth.users on signup/update.
-- This is often handled by application logic or Supabase specific triggers.
-- Example (conceptual, might need adjustments for Supabase specifics):
-- CREATE OR REPLACE FUNCTION public.handle_new_user() 
-- RETURNS trigger 
-- LANGUAGE plpgsql 
-- SECURITY DEFINER SET search_path = public
-- AS $$
-- BEGIN
--   INSERT INTO public.users (id, email, display_name) 
--   VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
--   RETURN new;
-- END;
-- $$;
-- 
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON COLUMN users.id IS 'Primary key, references auth.users.id';
COMMENT ON COLUMN users.role IS 'User role: user, moderator, admin'; 