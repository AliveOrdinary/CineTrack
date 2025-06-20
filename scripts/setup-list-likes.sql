-- List Likes and Cloning System Setup
-- This script creates the necessary tables and policies for list likes and cloning

-- Create list_likes table to track likes on custom lists
CREATE TABLE IF NOT EXISTS list_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create list_clones table to track cloned lists and attribution
CREATE TABLE IF NOT EXISTS list_clones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  original_list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  cloned_list_id UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  cloned_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Clone metadata
  clone_notes TEXT, -- Optional notes added by the person cloning
  is_attribution_visible BOOLEAN DEFAULT TRUE, -- Whether to show original creator attribution
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_list_likes_user ON list_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_list_likes_list ON list_likes(list_id);
CREATE INDEX IF NOT EXISTS idx_list_likes_created_at ON list_likes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_list_clones_original ON list_clones(original_list_id);
CREATE INDEX IF NOT EXISTS idx_list_clones_cloned ON list_clones(cloned_list_id);
CREATE INDEX IF NOT EXISTS idx_list_clones_user ON list_clones(cloned_by_user_id);
CREATE INDEX IF NOT EXISTS idx_list_clones_created_at ON list_clones(created_at DESC);

-- Prevent duplicate likes (one user can only like a list once)
CREATE UNIQUE INDEX IF NOT EXISTS idx_list_likes_unique 
ON list_likes(user_id, list_id);

-- Prevent duplicate clone tracking (one clone relationship per pair)
CREATE UNIQUE INDEX IF NOT EXISTS idx_list_clones_unique 
ON list_clones(original_list_id, cloned_list_id);

-- Enable Row Level Security
ALTER TABLE list_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_clones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for list_likes

-- Users can view likes on public lists or their own lists
CREATE POLICY "Users can view list likes" ON list_likes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM custom_lists cl
    WHERE cl.id = list_id 
    AND (cl.visibility = 'public' OR cl.user_id = auth.uid())
  )
);

-- Users can like public lists and lists shared with followers (if they follow the creator)
CREATE POLICY "Users can like accessible lists" ON list_likes
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM custom_lists cl
    WHERE cl.id = list_id 
    AND cl.user_id != auth.uid() -- Can't like your own lists
    AND (
      cl.visibility = 'public' 
      OR (
        cl.visibility = 'followers' 
        AND EXISTS (
          SELECT 1 FROM follows f 
          WHERE f.follower_id = auth.uid() AND f.following_id = cl.user_id
        )
      )
    )
  )
);

-- Users can remove their own likes
CREATE POLICY "Users can remove their likes" ON list_likes
FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for list_clones

-- Users can view clone information for public lists or their own lists
CREATE POLICY "Users can view list clones" ON list_clones
FOR SELECT USING (
  cloned_by_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM custom_lists cl
    WHERE cl.id = original_list_id 
    AND (cl.visibility = 'public' OR cl.user_id = auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM custom_lists cl
    WHERE cl.id = cloned_list_id 
    AND cl.user_id = auth.uid()
  )
);

-- Users can create clone records for lists they clone
CREATE POLICY "Users can create clone records" ON list_clones
FOR INSERT WITH CHECK (
  cloned_by_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM custom_lists cl
    WHERE cl.id = cloned_list_id AND cl.user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM custom_lists cl
    WHERE cl.id = original_list_id 
    AND cl.user_id != auth.uid() -- Can't clone your own lists
    AND (
      cl.visibility = 'public' 
      OR (
        cl.visibility = 'followers' 
        AND EXISTS (
          SELECT 1 FROM follows f 
          WHERE f.follower_id = auth.uid() AND f.following_id = cl.user_id
        )
      )
    )
  )
);

-- Users can update clone records for their own clones
CREATE POLICY "Users can update their clone records" ON list_clones
FOR UPDATE USING (
  cloned_by_user_id = auth.uid()
) WITH CHECK (
  cloned_by_user_id = auth.uid()
);

-- Users can delete clone records for their own clones
CREATE POLICY "Users can delete their clone records" ON list_clones
FOR DELETE USING (
  cloned_by_user_id = auth.uid()
);

-- Add likes_count column to custom_lists table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_lists' AND column_name = 'likes_count') THEN
    ALTER TABLE custom_lists ADD COLUMN likes_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add clones_count column to custom_lists table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'custom_lists' AND column_name = 'clones_count') THEN
    ALTER TABLE custom_lists ADD COLUMN clones_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create functions to update like and clone counts
CREATE OR REPLACE FUNCTION update_list_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE custom_lists 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE custom_lists 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_list_clones_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE custom_lists 
    SET clones_count = clones_count + 1 
    WHERE id = NEW.original_list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE custom_lists 
    SET clones_count = GREATEST(0, clones_count - 1) 
    WHERE id = OLD.original_list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update counts
DROP TRIGGER IF EXISTS list_likes_count_trigger ON list_likes;
CREATE TRIGGER list_likes_count_trigger
  AFTER INSERT OR DELETE ON list_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_list_likes_count();

DROP TRIGGER IF EXISTS list_clones_count_trigger ON list_clones;
CREATE TRIGGER list_clones_count_trigger
  AFTER INSERT OR DELETE ON list_clones
  FOR EACH ROW
  EXECUTE FUNCTION update_list_clones_count();

-- Create view for lists with engagement metrics
CREATE OR REPLACE VIEW lists_with_engagement AS
SELECT 
  cl.*,
  u.display_name as creator_name,
  u.avatar_url as creator_avatar,
  COALESCE(cl.likes_count, 0) as total_likes,
  COALESCE(cl.clones_count, 0) as total_clones,
  COALESCE(li.item_count, 0) as item_count,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN EXISTS (
      SELECT 1 FROM list_likes ll 
      WHERE ll.list_id = cl.id AND ll.user_id = auth.uid()
    )
    ELSE FALSE
  END as is_liked_by_current_user,
  lc.original_list_id,
  lc.is_attribution_visible,
  original_creator.display_name as original_creator_name,
  original_creator.avatar_url as original_creator_avatar
FROM custom_lists cl
JOIN users u ON cl.user_id = u.id
LEFT JOIN (
  SELECT list_id, COUNT(*) as item_count
  FROM list_items
  GROUP BY list_id
) li ON cl.id = li.list_id
LEFT JOIN list_clones lc ON cl.id = lc.cloned_list_id
LEFT JOIN custom_lists original_list ON lc.original_list_id = original_list.id
LEFT JOIN users original_creator ON original_list.user_id = original_creator.id;

-- Grant access to the view
GRANT SELECT ON lists_with_engagement TO authenticated;

-- Create view for popular lists (trending by engagement)
CREATE OR REPLACE VIEW popular_lists AS
SELECT 
  lwe.*,
  (
    COALESCE(lwe.total_likes, 0) * 2 + 
    COALESCE(lwe.total_clones, 0) * 5 +
    COALESCE(lwe.item_count, 0) * 0.1
  ) as popularity_score,
  EXTRACT(EPOCH FROM (NOW() - lwe.created_at)) / 86400 as age_in_days
FROM lists_with_engagement lwe
WHERE lwe.visibility = 'public'
ORDER BY popularity_score DESC, lwe.created_at DESC;

-- Grant access to the view
GRANT SELECT ON popular_lists TO authenticated;

-- Create view for user's liked lists
CREATE OR REPLACE VIEW user_liked_lists AS
SELECT 
  ll.*,
  lwe.*
FROM list_likes ll
JOIN lists_with_engagement lwe ON ll.list_id = lwe.id
WHERE ll.user_id = auth.uid()
ORDER BY ll.created_at DESC;

-- Grant access to the view
GRANT SELECT ON user_liked_lists TO authenticated;

-- Create view for clone relationships
CREATE OR REPLACE VIEW list_clone_relationships AS
SELECT 
  lc.*,
  original.name as original_list_name,
  original.description as original_list_description,
  original.user_id as original_creator_id,
  original_creator.display_name as original_creator_name,
  original_creator.avatar_url as original_creator_avatar,
  cloned.name as cloned_list_name,
  cloned.description as cloned_list_description,
  cloned.user_id as cloned_creator_id,
  cloned_creator.display_name as cloned_creator_name,
  cloned_creator.avatar_url as cloned_creator_avatar
FROM list_clones lc
JOIN custom_lists original ON lc.original_list_id = original.id
JOIN users original_creator ON original.user_id = original_creator.id
JOIN custom_lists cloned ON lc.cloned_list_id = cloned.id
JOIN users cloned_creator ON cloned.user_id = cloned_creator.id;

-- Grant access to the view
GRANT SELECT ON list_clone_relationships TO authenticated;

-- Function to get list engagement statistics
CREATE OR REPLACE FUNCTION get_list_engagement_stats(target_list_id UUID)
RETURNS TABLE (
  total_likes BIGINT,
  total_clones BIGINT,
  recent_likes BIGINT,
  recent_clones BIGINT,
  top_likers JSON,
  clone_creators JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH like_stats AS (
    SELECT 
      COUNT(*) as total_likes,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_likes
    FROM list_likes 
    WHERE list_id = target_list_id
  ),
  clone_stats AS (
    SELECT 
      COUNT(*) as total_clones,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_clones
    FROM list_clones 
    WHERE original_list_id = target_list_id
  ),
  top_likers AS (
    SELECT json_agg(
      json_build_object(
        'user_id', u.id,
        'display_name', u.display_name,
        'avatar_url', u.avatar_url,
        'liked_at', ll.created_at
      ) ORDER BY ll.created_at DESC
    ) as top_likers
    FROM list_likes ll
    JOIN users u ON ll.user_id = u.id
    WHERE ll.list_id = target_list_id
    LIMIT 10
  ),
  clone_creators AS (
    SELECT json_agg(
      json_build_object(
        'user_id', u.id,
        'display_name', u.display_name,
        'avatar_url', u.avatar_url,
        'cloned_at', lc.created_at,
        'clone_notes', lc.clone_notes
      ) ORDER BY lc.created_at DESC
    ) as clone_creators
    FROM list_clones lc
    JOIN users u ON lc.cloned_by_user_id = u.id
    WHERE lc.original_list_id = target_list_id
    LIMIT 10
  )
  SELECT 
    ls.total_likes,
    cs.total_clones,
    ls.recent_likes,
    cs.recent_clones,
    COALESCE(tl.top_likers, '[]'::json),
    COALESCE(cc.clone_creators, '[]'::json)
  FROM like_stats ls
  CROSS JOIN clone_stats cs
  CROSS JOIN top_likers tl
  CROSS JOIN clone_creators cc;
END;
$$;

-- Initialize likes_count and clones_count for existing lists
UPDATE custom_lists 
SET likes_count = (
  SELECT COUNT(*) FROM list_likes WHERE list_id = custom_lists.id
),
clones_count = (
  SELECT COUNT(*) FROM list_clones WHERE original_list_id = custom_lists.id
)
WHERE likes_count IS NULL OR clones_count IS NULL;