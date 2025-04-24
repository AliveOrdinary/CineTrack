-- Create schema for public
CREATE SCHEMA IF NOT EXISTS public;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.report_content CASCADE;
DROP TABLE IF EXISTS public.watchlist CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  region TEXT DEFAULT 'US',
  preferences JSONB DEFAULT '{}',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows Table
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Watched Content Table
CREATE TABLE watched_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  watched_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_rating SMALLINT CHECK (user_rating BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, media_type)
);

-- Watchlist Content Table
CREATE TABLE watchlist_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  priority SMALLINT DEFAULT 0,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE (user_id, tmdb_id, media_type)
);

-- Custom Lists Table
CREATE TABLE custom_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- List Items Table
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES custom_lists(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  sort_order INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (list_id, tmdb_id, media_type)
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  content TEXT NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 10),
  is_spoiler BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, media_type)
);

-- Review Interactions Table
CREATE TABLE review_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add partial unique index for likes (instead of inline WHERE clause)
CREATE UNIQUE INDEX unique_user_like_per_review 
ON review_interactions (review_id, user_id) 
WHERE interaction_type = 'like';

-- TMDB Cache Table (Optional)
CREATE TABLE tmdb_cache (
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv', 'person')),
  data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (tmdb_id, media_type)
);

-- Content Reports Table (keep this from original schema but updated)
CREATE TABLE report_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tmdb_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_content ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Follows policies
CREATE POLICY "Users can see all follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Watched Content policies
CREATE POLICY "Users can view their own watched content" ON watched_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their watched content" ON watched_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their watched content" ON watched_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their watched content" ON watched_content FOR DELETE USING (auth.uid() = user_id);

-- Watchlist policies
CREATE POLICY "Users can view their own watchlist" ON watchlist_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their watchlist" ON watchlist_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their watchlist" ON watchlist_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from their watchlist" ON watchlist_content FOR DELETE USING (auth.uid() = user_id);

-- Custom Lists policies
CREATE POLICY "Users can view public lists" ON custom_lists FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view their own lists" ON custom_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create lists" ON custom_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their lists" ON custom_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their lists" ON custom_lists FOR DELETE USING (auth.uid() = user_id);

-- List Items policies
CREATE POLICY "Users can view items in public lists" ON list_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_id AND is_public = true));
CREATE POLICY "Users can view items in their own lists" ON list_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_id AND custom_lists.user_id = auth.uid()));
CREATE POLICY "Users can add items to their lists" ON list_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_id AND custom_lists.user_id = auth.uid()));
CREATE POLICY "Users can update items in their lists" ON list_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_id AND custom_lists.user_id = auth.uid()));
CREATE POLICY "Users can delete items from their lists" ON list_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM custom_lists WHERE custom_lists.id = list_id AND custom_lists.user_id = auth.uid()));

-- Reviews policies
CREATE POLICY "Users can view all reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Review Interactions policies
CREATE POLICY "Users can view all interactions" ON review_interactions FOR SELECT USING (true);
CREATE POLICY "Users can create interactions" ON review_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their interactions" ON review_interactions FOR DELETE USING (auth.uid() = user_id);

-- TMDB Cache policies
CREATE POLICY "Anyone can view cached TMDB data" ON tmdb_cache FOR SELECT USING (true);
-- Only allow admin to insert/update/delete from cache
CREATE POLICY "Only admins can modify cache" ON tmdb_cache FOR INSERT WITH CHECK 
  (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Only admins can update cache" ON tmdb_cache FOR UPDATE USING 
  (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Only admins can delete cache" ON tmdb_cache FOR DELETE USING 
  (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Report Content policies
CREATE POLICY "Users can view their own reports" ON report_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON report_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all reports" ON report_content FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can update reports" ON report_content FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Create user handling trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 