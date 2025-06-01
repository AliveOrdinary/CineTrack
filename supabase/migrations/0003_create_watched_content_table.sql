-- Migration for creating the watched_content table

CREATE TABLE watched_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  watched_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_rating SMALLINT CHECK (user_rating BETWEEN 1 AND 10),
  is_rewatch BOOLEAN DEFAULT FALSE,
  rewatch_count INTEGER DEFAULT 0, 
  notes TEXT,
  contains_spoilers BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  posted_as_review BOOLEAN DEFAULT FALSE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, media_type, watched_date) -- Allows multiple watches on different dates
);

CREATE INDEX idx_watched_content_user_id ON watched_content(user_id);
CREATE INDEX idx_watched_content_media ON watched_content(tmdb_id, media_type);

COMMENT ON TABLE watched_content IS 'Tracks movies and TV shows watched by users';
COMMENT ON COLUMN watched_content.user_rating IS 'User''s personal rating from 1 to 10';
COMMENT ON COLUMN watched_content.visibility IS 'Visibility of this watch entry: public, followers, private';
COMMENT ON COLUMN watched_content.posted_as_review IS 'Indicates if this watch entry was used to create a review'; 