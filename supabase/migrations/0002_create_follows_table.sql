-- Migration for creating the follows table

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

COMMENT ON TABLE follows IS 'Stores user follow relationships';
COMMENT ON COLUMN follows.follower_id IS 'ID of the user who is following';
COMMENT ON COLUMN follows.following_id IS 'ID of the user who is being followed'; 