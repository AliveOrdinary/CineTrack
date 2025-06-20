-- Continue Watching Feature Setup
-- This script creates the necessary views and functions for the continue watching feature

-- Create view for user's TV show progress with next episodes
CREATE OR REPLACE VIEW user_tv_progress AS
WITH tv_shows_watched AS (
  -- Get all TV shows the user has watched episodes for
  SELECT DISTINCT
    et.user_id,
    et.tmdb_tv_id,
    COUNT(et.id) as total_episodes_watched,
    MAX(et.watched_date) as last_watched_date,
    MAX(et.created_at) as last_episode_added,
    -- Get the latest season and episode watched
    MAX(et.season_number) as latest_season,
    MAX(CASE WHEN et.season_number = MAX(et.season_number) THEN et.episode_number END) as latest_episode_in_season
  FROM episode_tracking et
  WHERE et.watched_date IS NOT NULL
  GROUP BY et.user_id, et.tmdb_tv_id
),
next_episodes AS (
  -- Calculate the next episode to watch for each show
  SELECT 
    tsw.*,
    -- Next episode logic: if latest episode in season, try next season episode 1
    -- Otherwise, next episode in same season
    CASE 
      WHEN tsw.latest_episode_in_season IS NULL THEN 1
      ELSE tsw.latest_episode_in_season + 1
    END as next_episode_number,
    tsw.latest_season as next_season_number
  FROM tv_shows_watched tsw
),
show_completion_status AS (
  -- Determine if shows are completed or have more content available
  SELECT 
    ne.*,
    -- Check if user has watched the show in the last 90 days (active watching)
    CASE 
      WHEN ne.last_watched_date > NOW() - INTERVAL '90 days' THEN true
      ELSE false
    END as is_actively_watching,
    -- Priority score based on recency and watch frequency
    (
      EXTRACT(EPOCH FROM (NOW() - ne.last_watched_date)) / 86400 -- Days since last watch
    ) * -1 + 
    (ne.total_episodes_watched * 0.1) as priority_score
  FROM next_episodes ne
)
SELECT 
  scs.*,
  -- Add user details
  u.display_name as user_name,
  u.avatar_url as user_avatar,
  -- Calculate watching streak (consecutive days with episodes watched)
  COALESCE(streak.consecutive_days, 0) as watching_streak
FROM show_completion_status scs
JOIN users u ON scs.user_id = u.id
LEFT JOIN (
  -- Calculate watching streaks
  SELECT 
    et.user_id,
    et.tmdb_tv_id,
    COUNT(DISTINCT DATE(et.watched_date)) as consecutive_days
  FROM episode_tracking et
  WHERE et.watched_date >= (
    SELECT MAX(watched_date) - INTERVAL '30 days' 
    FROM episode_tracking et2 
    WHERE et2.user_id = et.user_id AND et2.tmdb_tv_id = et.tmdb_tv_id
  )
  GROUP BY et.user_id, et.tmdb_tv_id
) streak ON scs.user_id = streak.user_id AND scs.tmdb_tv_id = streak.tmdb_tv_id
WHERE scs.is_actively_watching = true
ORDER BY scs.priority_score DESC;

-- Grant access to the view
GRANT SELECT ON user_tv_progress TO authenticated;

-- Create continue_watching table to store user preferences and custom next episodes
CREATE TABLE IF NOT EXISTS continue_watching (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_tv_id INTEGER NOT NULL,
  
  -- Next episode override (allows users to manually set next episode)
  next_season_number INTEGER,
  next_episode_number INTEGER,
  
  -- User preferences
  is_hidden BOOLEAN DEFAULT FALSE, -- Hide from continue watching list
  is_completed BOOLEAN DEFAULT FALSE, -- Mark series as completed
  priority_override INTEGER, -- Manual priority (1-10, 10 = highest)
  
  -- Notes and metadata
  notes TEXT, -- User notes about where they left off
  last_updated_by_user TIMESTAMP WITH TIME ZONE, -- When user last manually updated
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_continue_watching_user ON continue_watching(user_id);
CREATE INDEX IF NOT EXISTS idx_continue_watching_show ON continue_watching(tmdb_tv_id);
CREATE INDEX IF NOT EXISTS idx_continue_watching_priority ON continue_watching(priority_override DESC);
CREATE INDEX IF NOT EXISTS idx_continue_watching_hidden ON continue_watching(is_hidden);
CREATE INDEX IF NOT EXISTS idx_continue_watching_completed ON continue_watching(is_completed);

-- Prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_continue_watching_unique 
ON continue_watching(user_id, tmdb_tv_id);

-- Enable Row Level Security
ALTER TABLE continue_watching ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their continue watching entries" ON continue_watching
FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_continue_watching_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS continue_watching_updated_at ON continue_watching;
CREATE TRIGGER continue_watching_updated_at
  BEFORE UPDATE ON continue_watching
  FOR EACH ROW
  EXECUTE FUNCTION update_continue_watching_updated_at();

-- Create comprehensive continue watching view with overrides
CREATE OR REPLACE VIEW continue_watching_with_overrides AS
SELECT 
  utp.*,
  cw.id as continue_watching_id,
  COALESCE(cw.next_season_number, utp.next_season_number) as final_next_season,
  COALESCE(cw.next_episode_number, utp.next_episode_number) as final_next_episode,
  COALESCE(cw.is_hidden, false) as is_hidden,
  COALESCE(cw.is_completed, false) as is_completed,
  cw.priority_override,
  cw.notes,
  cw.last_updated_by_user,
  -- Final priority calculation
  CASE 
    WHEN cw.priority_override IS NOT NULL THEN cw.priority_override * 1000 -- Manual priority gets highest weight
    ELSE utp.priority_score
  END as final_priority_score,
  -- Engagement metrics
  CASE 
    WHEN utp.watching_streak > 7 THEN 'binge_watching'
    WHEN utp.watching_streak > 3 THEN 'regular_watching'
    WHEN utp.watching_streak > 0 THEN 'casual_watching'
    ELSE 'inactive'
  END as watching_pattern,
  -- Time since last episode
  EXTRACT(EPOCH FROM (NOW() - utp.last_watched_date)) / 86400 as days_since_last_episode
FROM user_tv_progress utp
LEFT JOIN continue_watching cw ON utp.user_id = cw.user_id AND utp.tmdb_tv_id = cw.tmdb_tv_id
WHERE COALESCE(cw.is_hidden, false) = false 
  AND COALESCE(cw.is_completed, false) = false
ORDER BY final_priority_score DESC;

-- Grant access to the view
GRANT SELECT ON continue_watching_with_overrides TO authenticated;

-- Function to get user's continue watching list with TMDB data integration
CREATE OR REPLACE FUNCTION get_continue_watching_for_user(
  target_user_id UUID,
  item_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  tmdb_tv_id INTEGER,
  total_episodes_watched BIGINT,
  last_watched_date TIMESTAMP WITH TIME ZONE,
  last_episode_added TIMESTAMP WITH TIME ZONE,
  next_season_number INTEGER,
  next_episode_number INTEGER,
  is_hidden BOOLEAN,
  is_completed BOOLEAN,
  priority_override INTEGER,
  notes TEXT,
  watching_pattern TEXT,
  days_since_last_episode NUMERIC,
  watching_streak BIGINT,
  final_priority_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cwo.tmdb_tv_id,
    cwo.total_episodes_watched,
    cwo.last_watched_date,
    cwo.last_episode_added,
    cwo.final_next_season as next_season_number,
    cwo.final_next_episode as next_episode_number,
    cwo.is_hidden,
    cwo.is_completed,
    cwo.priority_override,
    cwo.notes,
    cwo.watching_pattern,
    cwo.days_since_last_episode,
    cwo.watching_streak,
    cwo.final_priority_score
  FROM continue_watching_with_overrides cwo
  WHERE cwo.user_id = target_user_id
  ORDER BY cwo.final_priority_score DESC
  LIMIT item_limit;
END;
$$;

-- Function to update continue watching entry
CREATE OR REPLACE FUNCTION upsert_continue_watching_entry(
  target_user_id UUID,
  tv_show_id INTEGER,
  next_season INTEGER DEFAULT NULL,
  next_episode INTEGER DEFAULT NULL,
  is_hidden_flag BOOLEAN DEFAULT NULL,
  is_completed_flag BOOLEAN DEFAULT NULL,
  priority_level INTEGER DEFAULT NULL,
  user_notes TEXT DEFAULT NULL
)
RETURNS continue_watching
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result continue_watching;
BEGIN
  INSERT INTO continue_watching (
    user_id,
    tmdb_tv_id,
    next_season_number,
    next_episode_number,
    is_hidden,
    is_completed,
    priority_override,
    notes,
    last_updated_by_user
  ) VALUES (
    target_user_id,
    tv_show_id,
    next_season,
    next_episode,
    COALESCE(is_hidden_flag, false),
    COALESCE(is_completed_flag, false),
    priority_level,
    user_notes,
    NOW()
  )
  ON CONFLICT (user_id, tmdb_tv_id)
  DO UPDATE SET
    next_season_number = COALESCE(EXCLUDED.next_season_number, continue_watching.next_season_number),
    next_episode_number = COALESCE(EXCLUDED.next_episode_number, continue_watching.next_episode_number),
    is_hidden = COALESCE(EXCLUDED.is_hidden, continue_watching.is_hidden),
    is_completed = COALESCE(EXCLUDED.is_completed, continue_watching.is_completed),
    priority_override = COALESCE(EXCLUDED.priority_override, continue_watching.priority_override),
    notes = COALESCE(EXCLUDED.notes, continue_watching.notes),
    last_updated_by_user = EXCLUDED.last_updated_by_user,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Function to get watching statistics for a user
CREATE OR REPLACE FUNCTION get_user_watching_stats(target_user_id UUID)
RETURNS TABLE (
  active_shows INTEGER,
  completed_shows INTEGER,
  total_episodes_watched BIGINT,
  longest_streak INTEGER,
  favorite_genre TEXT,
  average_episodes_per_show NUMERIC,
  binge_shows INTEGER,
  regular_shows INTEGER,
  casual_shows INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE NOT is_completed) as active_count,
      COUNT(*) FILTER (WHERE is_completed) as completed_count,
      SUM(total_episodes_watched) as total_episodes,
      MAX(watching_streak) as max_streak,
      COUNT(*) FILTER (WHERE watching_pattern = 'binge_watching') as binge_count,
      COUNT(*) FILTER (WHERE watching_pattern = 'regular_watching') as regular_count,
      COUNT(*) FILTER (WHERE watching_pattern = 'casual_watching') as casual_count,
      AVG(total_episodes_watched) as avg_episodes
    FROM continue_watching_with_overrides
    WHERE user_id = target_user_id
  )
  SELECT 
    s.active_count::INTEGER,
    s.completed_count::INTEGER,
    s.total_episodes,
    s.max_streak::INTEGER,
    'Unknown'::TEXT as fav_genre, -- Would need TMDB integration
    s.avg_episodes,
    s.binge_count::INTEGER,
    s.regular_count::INTEGER,
    s.casual_count::INTEGER
  FROM stats s;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_episode_tracking_user_date ON episode_tracking(user_id, watched_date DESC);
CREATE INDEX IF NOT EXISTS idx_episode_tracking_show_season_episode ON episode_tracking(tmdb_tv_id, season_number, episode_number);

-- Sample function to automatically update continue watching when episodes are marked as watched
CREATE OR REPLACE FUNCTION auto_update_continue_watching()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a new episode being marked as watched
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.watched_date IS NULL AND NEW.watched_date IS NOT NULL) THEN
    -- Update or create continue watching entry
    PERFORM upsert_continue_watching_entry(
      NEW.user_id,
      NEW.tmdb_tv_id,
      NULL, -- Let the system calculate next episode
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update continue watching
DROP TRIGGER IF EXISTS auto_continue_watching_trigger ON episode_tracking;
CREATE TRIGGER auto_continue_watching_trigger
  AFTER INSERT OR UPDATE ON episode_tracking
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_continue_watching();

-- Create view for homepage continue watching widget
CREATE OR REPLACE VIEW homepage_continue_watching AS
SELECT 
  cwo.*,
  -- Add urgency indicators
  CASE 
    WHEN cwo.days_since_last_episode > 30 THEN 'stale'
    WHEN cwo.days_since_last_episode > 14 THEN 'old' 
    WHEN cwo.days_since_last_episode > 7 THEN 'recent'
    ELSE 'fresh'
  END as urgency_level,
  -- Recommendation strength
  CASE 
    WHEN cwo.watching_streak > 5 AND cwo.days_since_last_episode < 7 THEN 'high'
    WHEN cwo.watching_streak > 2 AND cwo.days_since_last_episode < 14 THEN 'medium'
    ELSE 'low'
  END as recommendation_strength
FROM continue_watching_with_overrides cwo
WHERE cwo.user_id = auth.uid()
  AND cwo.days_since_last_episode <= 90 -- Only shows watched in last 3 months
ORDER BY cwo.final_priority_score DESC
LIMIT 10;

-- Grant access to the view
GRANT SELECT ON homepage_continue_watching TO authenticated;