-- Migration for creating the watchlist_content table

CREATE TABLE watchlist_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  priority SMALLINT DEFAULT 0, -- e.g., 0=None, 1=Low, 2=Medium, 3=High
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  UNIQUE (user_id, tmdb_id, media_type)
);

CREATE INDEX idx_watchlist_user_id ON watchlist_content(user_id);

COMMENT ON TABLE watchlist_content IS 'Stores items users want to watch later';
COMMENT ON COLUMN watchlist_content.priority IS 'User-defined priority for the watchlist item'; 