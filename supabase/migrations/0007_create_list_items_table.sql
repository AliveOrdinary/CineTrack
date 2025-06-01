-- Migration for creating the list_items table

CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  sort_order INTEGER NOT NULL DEFAULT 0, -- Ensures items can be ordered
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (list_id, tmdb_id, media_type)
);

CREATE INDEX idx_list_items_list_id ON list_items(list_id, sort_order);

COMMENT ON TABLE list_items IS 'Stores items within a user''s custom list';
COMMENT ON COLUMN list_items.sort_order IS 'Order of the item within the list'; 