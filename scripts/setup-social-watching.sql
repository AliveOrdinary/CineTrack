-- Social Watching Tags System Setup
-- This script creates the necessary tables and policies for social watching tags

-- Create social_watching table to track who users watched content with
CREATE TABLE IF NOT EXISTS social_watching (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Reference to the watched content entry
  watched_content_id UUID NOT NULL REFERENCES watched_content(id) ON DELETE CASCADE,
  
  -- User who was watched with
  watched_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Additional context
  notes TEXT,
  watching_context VARCHAR(50), -- 'theater', 'home', 'streaming', 'other'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_watching_watched_content ON social_watching(watched_content_id);
CREATE INDEX IF NOT EXISTS idx_social_watching_user ON social_watching(watched_with_user_id);
CREATE INDEX IF NOT EXISTS idx_social_watching_context ON social_watching(watching_context);
CREATE INDEX IF NOT EXISTS idx_social_watching_created_at ON social_watching(created_at DESC);

-- Prevent duplicate entries (same content watched with same person)
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_watching_unique 
ON social_watching(watched_content_id, watched_with_user_id);

-- Enable Row Level Security
ALTER TABLE social_watching ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view social watching entries where they are either the watcher or the person watched with
CREATE POLICY "Users can view their social watching entries" ON social_watching
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM watched_content wc
    WHERE wc.id = watched_content_id AND wc.user_id = auth.uid()
  ) OR
  watched_with_user_id = auth.uid()
);

-- Users can create social watching entries for their own watched content
CREATE POLICY "Users can create social watching entries" ON social_watching
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM watched_content wc
    WHERE wc.id = watched_content_id AND wc.user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = watched_with_user_id
  )
);

-- Users can update social watching entries for their own watched content
CREATE POLICY "Users can update their social watching entries" ON social_watching
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM watched_content wc
    WHERE wc.id = watched_content_id AND wc.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM watched_content wc
    WHERE wc.id = watched_content_id AND wc.user_id = auth.uid()
  )
);

-- Users can delete social watching entries for their own watched content
CREATE POLICY "Users can delete their social watching entries" ON social_watching
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM watched_content wc
    WHERE wc.id = watched_content_id AND wc.user_id = auth.uid()
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_watching_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS social_watching_updated_at ON social_watching;
CREATE TRIGGER social_watching_updated_at
  BEFORE UPDATE ON social_watching
  FOR EACH ROW
  EXECUTE FUNCTION update_social_watching_updated_at();

-- Create view for social watching statistics
CREATE OR REPLACE VIEW social_watching_stats AS
SELECT 
  u.id as user_id,
  u.display_name,
  COUNT(DISTINCT sw.watched_with_user_id) as unique_watch_partners,
  COUNT(sw.id) as total_social_watches,
  COUNT(CASE WHEN sw.watching_context = 'theater' THEN 1 END) as theater_watches,
  COUNT(CASE WHEN sw.watching_context = 'home' THEN 1 END) as home_watches,
  COUNT(CASE WHEN sw.watching_context = 'streaming' THEN 1 END) as streaming_watches,
  MAX(sw.created_at) as last_social_watch_date
FROM users u
LEFT JOIN watched_content wc ON u.id = wc.user_id
LEFT JOIN social_watching sw ON wc.id = sw.watched_content_id
GROUP BY u.id, u.display_name;

-- Grant access to the view
GRANT SELECT ON social_watching_stats TO authenticated;

-- Create view for watch partner relationships
CREATE OR REPLACE VIEW watch_partners AS
WITH mutual_watches AS (
  SELECT DISTINCT
    wc1.user_id as user1_id,
    sw1.watched_with_user_id as user2_id,
    COUNT(*) as shared_content_count,
    MAX(sw1.created_at) as last_watched_together
  FROM social_watching sw1
  JOIN watched_content wc1 ON sw1.watched_content_id = wc1.id
  WHERE sw1.watched_with_user_id != wc1.user_id
  GROUP BY wc1.user_id, sw1.watched_with_user_id
  
  UNION
  
  SELECT DISTINCT
    sw2.watched_with_user_id as user1_id,
    wc2.user_id as user2_id,
    COUNT(*) as shared_content_count,
    MAX(sw2.created_at) as last_watched_together
  FROM social_watching sw2
  JOIN watched_content wc2 ON sw2.watched_content_id = wc2.id
  WHERE sw2.watched_with_user_id != wc2.user_id
  GROUP BY sw2.watched_with_user_id, wc2.user_id
)
SELECT 
  user1_id,
  user2_id,
  u1.display_name as user1_name,
  u2.display_name as user2_name,
  u1.avatar_url as user1_avatar,
  u2.avatar_url as user2_avatar,
  SUM(shared_content_count) as total_shared_watches,
  MAX(last_watched_together) as last_watched_together
FROM mutual_watches mw
JOIN users u1 ON mw.user1_id = u1.id
JOIN users u2 ON mw.user2_id = u2.id
WHERE user1_id < user2_id -- Avoid duplicate pairs
GROUP BY user1_id, user2_id, u1.display_name, u2.display_name, u1.avatar_url, u2.avatar_url
ORDER BY total_shared_watches DESC;

-- Grant access to the view
GRANT SELECT ON watch_partners TO authenticated;

-- Create function to get most frequent watch partners for a user
CREATE OR REPLACE FUNCTION get_user_watch_partners(target_user_id UUID, partner_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  partner_id UUID,
  partner_name TEXT,
  partner_avatar TEXT,
  shared_watches BIGINT,
  last_watched_together TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN wp.user1_id = target_user_id THEN wp.user2_id
      ELSE wp.user1_id
    END as partner_id,
    CASE 
      WHEN wp.user1_id = target_user_id THEN wp.user2_name
      ELSE wp.user1_name
    END as partner_name,
    CASE 
      WHEN wp.user1_id = target_user_id THEN wp.user2_avatar
      ELSE wp.user1_avatar
    END as partner_avatar,
    wp.total_shared_watches as shared_watches,
    wp.last_watched_together
  FROM watch_partners wp
  WHERE wp.user1_id = target_user_id OR wp.user2_id = target_user_id
  ORDER BY wp.total_shared_watches DESC, wp.last_watched_together DESC
  LIMIT partner_limit;
END;
$$;

-- Create notification triggers (placeholder for notification system integration)
CREATE OR REPLACE FUNCTION notify_social_watching_created()
RETURNS TRIGGER AS $$
BEGIN
  -- This would integrate with your notification system
  -- Notify the person who was tagged in the social watch
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
DROP TRIGGER IF EXISTS social_watching_created_notify ON social_watching;
CREATE TRIGGER social_watching_created_notify
  AFTER INSERT ON social_watching
  FOR EACH ROW
  EXECUTE FUNCTION notify_social_watching_created();

-- Sample data (optional, for testing)
-- Uncomment the following lines to add sample data

/*
-- Insert sample social watching entries (assuming you have test data)
INSERT INTO social_watching (watched_content_id, watched_with_user_id, notes, watching_context)
VALUES 
  -- Replace with actual IDs from your watched_content and users tables
  ('watched-content-id-1', 'user-id-2', 'Great movie night!', 'home'),
  ('watched-content-id-2', 'user-id-3', 'Saw this at the theater together', 'theater'),
  ('watched-content-id-3', 'user-id-2', 'Binge watched the whole season', 'streaming');
*/