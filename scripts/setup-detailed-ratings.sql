-- Setup Detailed Ratings System
-- Run this in Supabase SQL Editor

-- Create detailed_ratings table
CREATE TABLE IF NOT EXISTS detailed_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  
  -- Category ratings (1-10 scale)
  acting_rating INTEGER CHECK (acting_rating >= 1 AND acting_rating <= 10),
  story_rating INTEGER CHECK (story_rating >= 1 AND story_rating <= 10),
  directing_rating INTEGER CHECK (directing_rating >= 1 AND directing_rating <= 10),
  cinematography_rating INTEGER CHECK (cinematography_rating >= 1 AND cinematography_rating <= 10),
  music_rating INTEGER CHECK (music_rating >= 1 AND music_rating <= 10),
  production_rating INTEGER CHECK (production_rating >= 1 AND production_rating <= 10),
  
  -- Overall rating (calculated from categories)
  overall_rating DECIMAL(3,1) GENERATED ALWAYS AS (
    CASE 
      WHEN acting_rating IS NOT NULL OR story_rating IS NOT NULL OR directing_rating IS NOT NULL 
           OR cinematography_rating IS NOT NULL OR music_rating IS NOT NULL OR production_rating IS NOT NULL
      THEN (
        COALESCE(acting_rating, 0) + 
        COALESCE(story_rating, 0) + 
        COALESCE(directing_rating, 0) + 
        COALESCE(cinematography_rating, 0) + 
        COALESCE(music_rating, 0) + 
        COALESCE(production_rating, 0)
      ) / NULLIF(
        (CASE WHEN acting_rating IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN story_rating IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN directing_rating IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN cinematography_rating IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN music_rating IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN production_rating IS NOT NULL THEN 1 ELSE 0 END), 0
      )
      ELSE NULL
    END
  ) STORED,
  
  -- Emotional reactions (boolean flags)
  made_me_cry BOOLEAN DEFAULT FALSE,
  made_me_laugh BOOLEAN DEFAULT FALSE,
  was_scary BOOLEAN DEFAULT FALSE,
  was_inspiring BOOLEAN DEFAULT FALSE,
  was_thought_provoking BOOLEAN DEFAULT FALSE,
  was_nostalgic BOOLEAN DEFAULT FALSE,
  was_romantic BOOLEAN DEFAULT FALSE,
  was_intense BOOLEAN DEFAULT FALSE,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, tmdb_id, media_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_detailed_ratings_user_id ON detailed_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_detailed_ratings_tmdb_id ON detailed_ratings(tmdb_id, media_type);
CREATE INDEX IF NOT EXISTS idx_detailed_ratings_overall ON detailed_ratings(overall_rating DESC) WHERE overall_rating IS NOT NULL;

-- Enable RLS
ALTER TABLE detailed_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own detailed ratings" 
ON detailed_ratings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own detailed ratings" 
ON detailed_ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detailed ratings" 
ON detailed_ratings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detailed ratings" 
ON detailed_ratings FOR DELETE 
USING (auth.uid() = user_id);

-- Public read access for detailed ratings (respecting user privacy preferences)
CREATE POLICY "Public can view detailed ratings for public content"
ON detailed_ratings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_preferences up 
    WHERE up.user_id = detailed_ratings.user_id 
    AND up.default_review_visibility = 'public'
  )
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_detailed_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_detailed_ratings_updated_at
  BEFORE UPDATE ON detailed_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_detailed_ratings_updated_at();

-- Create a view for aggregated ratings by content
CREATE OR REPLACE VIEW content_detailed_ratings AS
SELECT 
  tmdb_id,
  media_type,
  COUNT(*) as total_ratings,
  AVG(acting_rating) as avg_acting,
  AVG(story_rating) as avg_story,
  AVG(directing_rating) as avg_directing,
  AVG(cinematography_rating) as avg_cinematography,
  AVG(music_rating) as avg_music,
  AVG(production_rating) as avg_production,
  AVG(overall_rating) as avg_overall,
  
  -- Emotional reaction percentages
  (COUNT(*) FILTER (WHERE made_me_cry = true) * 100.0 / COUNT(*)) as cry_percentage,
  (COUNT(*) FILTER (WHERE made_me_laugh = true) * 100.0 / COUNT(*)) as laugh_percentage,
  (COUNT(*) FILTER (WHERE was_scary = true) * 100.0 / COUNT(*)) as scary_percentage,
  (COUNT(*) FILTER (WHERE was_inspiring = true) * 100.0 / COUNT(*)) as inspiring_percentage,
  (COUNT(*) FILTER (WHERE was_thought_provoking = true) * 100.0 / COUNT(*)) as thought_provoking_percentage,
  (COUNT(*) FILTER (WHERE was_nostalgic = true) * 100.0 / COUNT(*)) as nostalgic_percentage,
  (COUNT(*) FILTER (WHERE was_romantic = true) * 100.0 / COUNT(*)) as romantic_percentage,
  (COUNT(*) FILTER (WHERE was_intense = true) * 100.0 / COUNT(*)) as intense_percentage
FROM detailed_ratings
WHERE overall_rating IS NOT NULL
GROUP BY tmdb_id, media_type;

-- Grant access to the view
GRANT SELECT ON content_detailed_ratings TO authenticated, anon;