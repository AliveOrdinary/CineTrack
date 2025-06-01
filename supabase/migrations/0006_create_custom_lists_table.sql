-- Migration for creating the custom_lists table

CREATE TABLE custom_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  banner_image_url TEXT NULL, -- Stores URL from Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_lists_user_id ON custom_lists(user_id);
CREATE INDEX idx_custom_lists_public_visibility ON custom_lists(visibility, updated_at DESC) WHERE visibility = 'public';

COMMENT ON TABLE custom_lists IS 'Allows users to create personalized lists of content';
COMMENT ON COLUMN custom_lists.banner_image_url IS 'URL for the custom banner image of the list'; 