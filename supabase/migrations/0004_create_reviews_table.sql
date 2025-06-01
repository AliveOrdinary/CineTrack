-- Migration for creating the reviews table

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  content TEXT NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 10), -- Rating associated with the review itself
  is_spoiler BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
  likes_count INTEGER DEFAULT 0, 
  comments_count INTEGER DEFAULT 0, 
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  watched_content_id UUID REFERENCES watched_content(id) ON DELETE SET NULL, -- Optional link to a specific watch entry
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, tmdb_id, media_type) -- User can only have one review per item
);

CREATE INDEX idx_reviews_media ON reviews(tmdb_id, media_type);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_watched_content_id ON reviews(watched_content_id);

COMMENT ON TABLE reviews IS 'Stores user reviews for movies and TV shows';
COMMENT ON COLUMN reviews.watched_content_id IS 'Optional link to the specific watched_content entry this review is based on';
COMMENT ON COLUMN reviews.rating IS 'Overall rating given as part of this review (1-10)'; 