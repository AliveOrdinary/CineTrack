-- Review Response Prompts System Setup
-- This script creates the necessary tables and data for guided review prompts

-- Create review_prompts table to store predefined prompts
CREATE TABLE IF NOT EXISTS review_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Prompt details
  category VARCHAR(50) NOT NULL, -- 'plot', 'characters', 'technical', 'emotional', 'recommendation'
  prompt_text TEXT NOT NULL,
  placeholder_text TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  media_type VARCHAR(10) CHECK (media_type IN ('movie', 'tv', 'both')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review_responses table to store user responses to prompts
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES review_prompts(id) ON DELETE CASCADE,
  
  -- Response content
  response_text TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_prompts_category ON review_prompts(category);
CREATE INDEX IF NOT EXISTS idx_review_prompts_active ON review_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_review_prompts_media_type ON review_prompts(media_type);
CREATE INDEX IF NOT EXISTS idx_review_prompts_sort_order ON review_prompts(sort_order);

CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_prompt ON review_responses(prompt_id);

-- Prevent duplicate responses for the same prompt in a review
CREATE UNIQUE INDEX IF NOT EXISTS idx_review_responses_unique 
ON review_responses(review_id, prompt_id);

-- Enable Row Level Security
ALTER TABLE review_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_prompts (read-only for authenticated users)
CREATE POLICY "Anyone can view active review prompts" ON review_prompts
FOR SELECT USING (is_active = true);

-- RLS Policies for review_responses
CREATE POLICY "Users can view review responses for public reviews" ON review_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.id = review_id AND r.visibility = 'public'
  ) OR
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create responses for their reviews" ON review_responses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their review responses" ON review_responses
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their review responses" ON review_responses
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM reviews r
    WHERE r.id = review_id AND r.user_id = auth.uid()
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_review_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS review_prompts_updated_at ON review_prompts;
CREATE TRIGGER review_prompts_updated_at
  BEFORE UPDATE ON review_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_review_prompts_updated_at();

DROP TRIGGER IF EXISTS review_responses_updated_at ON review_responses;
CREATE TRIGGER review_responses_updated_at
  BEFORE UPDATE ON review_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_review_responses_updated_at();

-- Insert predefined review prompts
INSERT INTO review_prompts (category, prompt_text, placeholder_text, media_type, sort_order) VALUES
-- Plot & Story prompts
('plot', 'What did you think of the overall story?', 'Describe what you liked or disliked about the plot...', 'both', 1),
('plot', 'How was the pacing of the story?', 'Was it too slow, too fast, or just right?', 'both', 2),
('plot', 'Were there any plot twists that surprised you?', 'Discuss any unexpected moments (avoid spoilers)...', 'both', 3),
('plot', 'How satisfying was the ending?', 'Did the conclusion feel earned and complete?', 'both', 4),

-- Character prompts
('characters', 'What did you think of the main characters?', 'Discuss character development, believability, etc...', 'both', 1),
('characters', 'Which character did you connect with most?', 'Explain why this character resonated with you...', 'both', 2),
('characters', 'How was the character development?', 'Did characters grow and change in believable ways?', 'both', 3),
('characters', 'What about the supporting cast?', 'How did secondary characters contribute to the story?', 'both', 4),

-- Technical aspects
('technical', 'How were the visuals and cinematography?', 'Comment on the visual style, effects, camera work...', 'both', 1),
('technical', 'What did you think of the soundtrack/score?', 'How did the music enhance or detract from the experience?', 'both', 2),
('technical', 'How was the acting/voice acting?', 'Evaluate the performances of the cast...', 'both', 3),
('technical', 'What about the production quality?', 'Consider editing, sound design, special effects...', 'both', 4),

-- Emotional impact
('emotional', 'How did this make you feel?', 'Describe the emotions this content evoked...', 'both', 1),
('emotional', 'What moments stood out to you?', 'Which scenes were most memorable or impactful?', 'both', 2),
('emotional', 'Did it meet your expectations?', 'How did it compare to what you hoped for?', 'both', 3),
('emotional', 'What themes resonated with you?', 'Discuss any deeper meanings or messages...', 'both', 4),

-- Recommendation prompts
('recommendation', 'Who would you recommend this to?', 'What type of viewer would enjoy this content?', 'both', 1),
('recommendation', 'What similar content would you compare it to?', 'Reference other movies/shows with similar appeal...', 'both', 2),
('recommendation', 'What would make someone love or hate this?', 'Identify potential deal-breakers or highlights...', 'both', 3),
('recommendation', 'Any content warnings or considerations?', 'Note anything viewers should be aware of beforehand...', 'both', 4),

-- TV-specific prompts
('plot', 'How was this season compared to previous ones?', 'Discuss season progression and quality...', 'tv', 5),
('characters', 'How has character development progressed?', 'Comment on long-term character arcs...', 'tv', 5),
('recommendation', 'Is this a good jumping-on point for new viewers?', 'Can someone start watching from this season/episode?', 'tv', 5),

-- Movie-specific prompts
('technical', 'How did the runtime feel?', 'Was the movie too long, too short, or just right?', 'movie', 5),
('emotional', 'How was the overall movie experience?', 'Consider the theatrical vs. home viewing experience...', 'movie', 5);

-- Create view for review prompts by category
CREATE OR REPLACE VIEW review_prompts_by_category AS
SELECT 
  category,
  media_type,
  COUNT(*) as prompt_count,
  ARRAY_AGG(
    json_build_object(
      'id', id,
      'prompt_text', prompt_text,
      'placeholder_text', placeholder_text,
      'sort_order', sort_order
    ) ORDER BY sort_order
  ) as prompts
FROM review_prompts
WHERE is_active = true
GROUP BY category, media_type;

-- Grant access to the view
GRANT SELECT ON review_prompts_by_category TO authenticated;

-- Create view for reviews with responses
CREATE OR REPLACE VIEW reviews_with_responses AS
SELECT 
  r.*,
  COALESCE(
    json_agg(
      json_build_object(
        'prompt_id', rr.prompt_id,
        'prompt_text', rp.prompt_text,
        'prompt_category', rp.category,
        'response_text', rr.response_text,
        'response_created_at', rr.created_at
      ) ORDER BY rp.sort_order
    ) FILTER (WHERE rr.id IS NOT NULL),
    '[]'::json
  ) as prompt_responses
FROM reviews r
LEFT JOIN review_responses rr ON r.id = rr.review_id
LEFT JOIN review_prompts rp ON rr.prompt_id = rp.id
GROUP BY r.id;

-- Grant access to the view
GRANT SELECT ON reviews_with_responses TO authenticated;