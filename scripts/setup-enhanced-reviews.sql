-- Enhanced Review System
-- Combines detailed ratings, emotional reactions, and comprehensive reviews
-- This replaces both the basic review system and detailed ratings system

-- Drop existing reviews table if it exists (backup data first in production!)
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS detailed_ratings CASCADE;

-- Create comprehensive enhanced_reviews table
CREATE TABLE IF NOT EXISTS enhanced_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  
  -- Basic review data
  title TEXT,
  content TEXT,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 10),
  
  -- Detailed category ratings (1-10 scale)
  acting_rating INTEGER CHECK (acting_rating >= 1 AND acting_rating <= 10),
  story_rating INTEGER CHECK (story_rating >= 1 AND story_rating <= 10),
  directing_rating INTEGER CHECK (directing_rating >= 1 AND directing_rating <= 10),
  cinematography_rating INTEGER CHECK (cinematography_rating >= 1 AND cinematography_rating <= 10),
  music_rating INTEGER CHECK (music_rating >= 1 AND music_rating <= 10),
  production_rating INTEGER CHECK (production_rating >= 1 AND production_rating <= 10),
  
  -- Emotional reactions (boolean flags)
  made_me_cry BOOLEAN DEFAULT FALSE,
  made_me_laugh BOOLEAN DEFAULT FALSE,
  was_scary BOOLEAN DEFAULT FALSE,
  was_inspiring BOOLEAN DEFAULT FALSE,
  was_thought_provoking BOOLEAN DEFAULT FALSE,
  was_nostalgic BOOLEAN DEFAULT FALSE,
  was_romantic BOOLEAN DEFAULT FALSE,
  was_intense BOOLEAN DEFAULT FALSE,
  was_confusing BOOLEAN DEFAULT FALSE,
  was_boring BOOLEAN DEFAULT FALSE,
  
  -- Review metadata
  contains_spoilers BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  review_type TEXT DEFAULT 'full' CHECK (review_type IN ('quick', 'full', 'detailed')),
  
  -- Social features
  likes_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Visibility and moderation
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_moderated BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  -- Watch context
  watched_date DATE,
  rewatch_number INTEGER DEFAULT 1,
  watch_method TEXT, -- 'theater', 'streaming', 'tv', 'physical'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_reviews_user ON enhanced_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_reviews_content ON enhanced_reviews(tmdb_id, media_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_reviews_rating ON enhanced_reviews(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_reviews_created ON enhanced_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_reviews_visibility ON enhanced_reviews(visibility);
CREATE INDEX IF NOT EXISTS idx_enhanced_reviews_featured ON enhanced_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_enhanced_reviews_moderation ON enhanced_reviews(moderation_status);

-- Unique constraint: one review per user per content
CREATE UNIQUE INDEX IF NOT EXISTS idx_enhanced_reviews_unique 
ON enhanced_reviews(user_id, tmdb_id, media_type);

-- Enable Row Level Security
ALTER TABLE enhanced_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view public reviews" ON enhanced_reviews
FOR SELECT USING (
  visibility = 'public' AND moderation_status = 'approved'
);

CREATE POLICY "Users can view follower reviews if following" ON enhanced_reviews
FOR SELECT USING (
  visibility = 'followers' AND moderation_status = 'approved' AND
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = auth.uid() AND following_id = enhanced_reviews.user_id
  )
);

CREATE POLICY "Users can view their own reviews" ON enhanced_reviews
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reviews" ON enhanced_reviews
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON enhanced_reviews
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reviews" ON enhanced_reviews
FOR DELETE USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enhanced_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS enhanced_reviews_updated_at ON enhanced_reviews;
CREATE TRIGGER enhanced_reviews_updated_at
  BEFORE UPDATE ON enhanced_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_enhanced_reviews_updated_at();

-- Create review interactions table
CREATE TABLE IF NOT EXISTS review_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES enhanced_reviews(id) ON DELETE CASCADE,
  
  -- Interaction type
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'helpful', 'report')),
  
  -- Additional data for reports
  report_reason TEXT, -- Only for 'report' interactions
  report_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_interactions_user ON review_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_interactions_review ON review_interactions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_interactions_type ON review_interactions(interaction_type);

-- Unique constraint: one interaction per user per review per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_interactions_unique 
ON review_interactions(user_id, review_id, interaction_type);

-- Enable Row Level Security
ALTER TABLE review_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interactions
CREATE POLICY "Users can view interactions on visible reviews" ON review_interactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enhanced_reviews er
    WHERE er.id = review_interactions.review_id
    AND (
      er.visibility = 'public' OR
      er.user_id = auth.uid() OR
      (er.visibility = 'followers' AND EXISTS (
        SELECT 1 FROM follows 
        WHERE follower_id = auth.uid() AND following_id = er.user_id
      ))
    )
  )
);

CREATE POLICY "Users can create interactions" ON review_interactions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own interactions" ON review_interactions
FOR DELETE USING (user_id = auth.uid());

-- Function to update review counts
CREATE OR REPLACE FUNCTION update_review_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'like' THEN
      UPDATE enhanced_reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
    ELSIF NEW.interaction_type = 'helpful' THEN
      UPDATE enhanced_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'like' THEN
      UPDATE enhanced_reviews SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.review_id;
    ELSIF OLD.interaction_type = 'helpful' THEN
      UPDATE enhanced_reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.review_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for count updates
DROP TRIGGER IF EXISTS review_interactions_count_trigger ON review_interactions;
CREATE TRIGGER review_interactions_count_trigger
  AFTER INSERT OR DELETE ON review_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_review_counts();

-- Create view for reviews with user information and interaction counts
CREATE OR REPLACE VIEW enhanced_reviews_with_details AS
SELECT 
  er.*,
  u.display_name as author_name,
  u.avatar_url as author_avatar,
  
  -- Calculate average rating from category ratings
  CASE 
    WHEN er.acting_rating IS NOT NULL OR er.story_rating IS NOT NULL OR 
         er.directing_rating IS NOT NULL OR er.cinematography_rating IS NOT NULL OR
         er.music_rating IS NOT NULL OR er.production_rating IS NOT NULL THEN
      ROUND(
        (COALESCE(er.acting_rating, 0) + COALESCE(er.story_rating, 0) + 
         COALESCE(er.directing_rating, 0) + COALESCE(er.cinematography_rating, 0) + 
         COALESCE(er.music_rating, 0) + COALESCE(er.production_rating, 0)) /
        NULLIF(
          (CASE WHEN er.acting_rating IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN er.story_rating IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN er.directing_rating IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN er.cinematography_rating IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN er.music_rating IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN er.production_rating IS NOT NULL THEN 1 ELSE 0 END), 0
        ), 1
      )
    ELSE er.overall_rating
  END as calculated_rating,
  
  -- Emotional reaction summary
  (
    (CASE WHEN er.made_me_cry THEN 1 ELSE 0 END) +
    (CASE WHEN er.made_me_laugh THEN 1 ELSE 0 END) +
    (CASE WHEN er.was_scary THEN 1 ELSE 0 END) +
    (CASE WHEN er.was_inspiring THEN 1 ELSE 0 END) +
    (CASE WHEN er.was_thought_provoking THEN 1 ELSE 0 END) +
    (CASE WHEN er.was_nostalgic THEN 1 ELSE 0 END) +
    (CASE WHEN er.was_romantic THEN 1 ELSE 0 END) +
    (CASE WHEN er.was_intense THEN 1 ELSE 0 END)
  ) as emotional_reactions_count,
  
  -- Check if current user has liked this review
  EXISTS(
    SELECT 1 FROM review_interactions ri 
    WHERE ri.review_id = er.id AND ri.user_id = auth.uid() AND ri.interaction_type = 'like'
  ) as is_liked_by_current_user,
  
  -- Check if current user found this review helpful
  EXISTS(
    SELECT 1 FROM review_interactions ri 
    WHERE ri.review_id = er.id AND ri.user_id = auth.uid() AND ri.interaction_type = 'helpful'
  ) as is_helpful_to_current_user
  
FROM enhanced_reviews er
JOIN users u ON er.user_id = u.id
WHERE er.moderation_status = 'approved';

-- Grant access to the view
GRANT SELECT ON enhanced_reviews_with_details TO authenticated;

-- Create view for content rating averages
CREATE OR REPLACE VIEW content_rating_averages AS
SELECT 
  tmdb_id,
  media_type,
  
  -- Overall statistics
  COUNT(*) as total_reviews,
  ROUND(AVG(overall_rating), 2) as avg_overall_rating,
  
  -- Category averages
  ROUND(AVG(acting_rating), 2) as avg_acting_rating,
  ROUND(AVG(story_rating), 2) as avg_story_rating,
  ROUND(AVG(directing_rating), 2) as avg_directing_rating,
  ROUND(AVG(cinematography_rating), 2) as avg_cinematography_rating,
  ROUND(AVG(music_rating), 2) as avg_music_rating,
  ROUND(AVG(production_rating), 2) as avg_production_rating,
  
  -- Emotional reaction percentages
  ROUND((COUNT(*) FILTER (WHERE made_me_cry = true) * 100.0 / COUNT(*)), 1) as cry_percentage,
  ROUND((COUNT(*) FILTER (WHERE made_me_laugh = true) * 100.0 / COUNT(*)), 1) as laugh_percentage,
  ROUND((COUNT(*) FILTER (WHERE was_scary = true) * 100.0 / COUNT(*)), 1) as scary_percentage,
  ROUND((COUNT(*) FILTER (WHERE was_inspiring = true) * 100.0 / COUNT(*)), 1) as inspiring_percentage,
  ROUND((COUNT(*) FILTER (WHERE was_thought_provoking = true) * 100.0 / COUNT(*)), 1) as thought_provoking_percentage,
  ROUND((COUNT(*) FILTER (WHERE was_nostalgic = true) * 100.0 / COUNT(*)), 1) as nostalgic_percentage,
  ROUND((COUNT(*) FILTER (WHERE was_romantic = true) * 100.0 / COUNT(*)), 1) as romantic_percentage,
  ROUND((COUNT(*) FILTER (WHERE was_intense = true) * 100.0 / COUNT(*)), 1) as intense_percentage,
  
  -- Review quality metrics
  ROUND(AVG(likes_count), 2) as avg_likes_per_review,
  ROUND(AVG(helpful_count), 2) as avg_helpful_per_review,
  
  -- Most recent review
  MAX(created_at) as last_review_date
  
FROM enhanced_reviews
WHERE moderation_status = 'approved' AND visibility = 'public'
GROUP BY tmdb_id, media_type;

-- Grant access to the view
GRANT SELECT ON content_rating_averages TO authenticated;

-- Create function to get personalized review recommendations
CREATE OR REPLACE FUNCTION get_review_recommendations(
  target_user_id UUID,
  content_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  tmdb_id INTEGER,
  media_type TEXT,
  avg_rating NUMERIC,
  review_count BIGINT,
  friend_reviews BIGINT,
  recommendation_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_follows AS (
    SELECT following_id FROM follows WHERE follower_id = target_user_id
  ),
  friend_reviews AS (
    SELECT 
      er.tmdb_id,
      er.media_type,
      AVG(er.overall_rating) as avg_rating,
      COUNT(*) as review_count,
      COUNT(*) FILTER (WHERE er.user_id IN (SELECT following_id FROM user_follows)) as friend_reviews
    FROM enhanced_reviews er
    WHERE er.moderation_status = 'approved'
      AND er.visibility IN ('public', 'followers')
      AND er.overall_rating >= 7 -- Only recommend well-rated content
    GROUP BY er.tmdb_id, er.media_type
    HAVING COUNT(*) >= 2 -- At least 2 reviews
  )
  SELECT 
    fr.tmdb_id,
    fr.media_type,
    fr.avg_rating,
    fr.review_count,
    fr.friend_reviews,
    -- Calculate recommendation score based on rating, review count, and friend factor
    (fr.avg_rating * 0.4 + 
     LEAST(fr.review_count * 0.1, 2.0) + 
     fr.friend_reviews * 0.5) as recommendation_score
  FROM friend_reviews fr
  WHERE NOT EXISTS (
    -- Don't recommend content the user has already reviewed
    SELECT 1 FROM enhanced_reviews er2 
    WHERE er2.user_id = target_user_id 
      AND er2.tmdb_id = fr.tmdb_id 
      AND er2.media_type = fr.media_type
  )
  ORDER BY recommendation_score DESC
  LIMIT content_limit;
END;
$$;