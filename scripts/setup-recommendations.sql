-- Content Recommendations System Setup
-- This script creates the necessary tables and policies for content recommendations

-- Create content_recommendations table
CREATE TABLE IF NOT EXISTS content_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Content information
  tmdb_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  
  -- Recommendation participants
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Recommendation details
  message TEXT,
  personal_rating DECIMAL(3,1) CHECK (personal_rating >= 1 AND personal_rating <= 10),
  recommended_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'watched')),
  response_date TIMESTAMP WITH TIME ZONE,
  response_message TEXT,
  
  -- Additional metadata
  is_urgent BOOLEAN DEFAULT FALSE,
  tags TEXT[], -- Array of string tags like ['horror', 'date-night', 'comfort-watch']
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_recommendations_recipient ON content_recommendations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_sender ON content_recommendations(sender_id);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_status ON content_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_content ON content_recommendations(tmdb_id, media_type);
CREATE INDEX IF NOT EXISTS idx_content_recommendations_created_at ON content_recommendations(created_at DESC);

-- Prevent self-recommendations
ALTER TABLE content_recommendations 
ADD CONSTRAINT no_self_recommendations 
CHECK (sender_id != recipient_id);

-- Create composite index for uniqueness checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_recommendations_unique 
ON content_recommendations(sender_id, recipient_id, tmdb_id, media_type)
WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view recommendations they sent or received
CREATE POLICY "Users can view their recommendations" ON content_recommendations
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Users can create recommendations to others (but not themselves)
CREATE POLICY "Users can create recommendations" ON content_recommendations
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  auth.uid() != recipient_id AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = recipient_id
  )
);

-- Users can update the status of recommendations they received
CREATE POLICY "Recipients can update recommendation status" ON content_recommendations
FOR UPDATE USING (
  auth.uid() = recipient_id
) WITH CHECK (
  auth.uid() = recipient_id AND
  -- Only allow updating response fields
  OLD.sender_id = NEW.sender_id AND
  OLD.recipient_id = NEW.recipient_id AND
  OLD.tmdb_id = NEW.tmdb_id AND
  OLD.media_type = NEW.media_type AND
  OLD.message = NEW.message AND
  OLD.personal_rating = NEW.personal_rating AND
  OLD.recommended_date = NEW.recommended_date AND
  OLD.is_urgent = NEW.is_urgent AND
  OLD.tags = NEW.tags
);

-- Senders can delete pending recommendations they sent
CREATE POLICY "Senders can delete pending recommendations" ON content_recommendations
FOR DELETE USING (
  auth.uid() = sender_id AND
  status = 'pending'
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS content_recommendations_updated_at ON content_recommendations;
CREATE TRIGGER content_recommendations_updated_at
  BEFORE UPDATE ON content_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_content_recommendations_updated_at();

-- Create view for recommendation statistics
CREATE OR REPLACE VIEW recommendation_stats AS
SELECT 
  u.id as user_id,
  u.display_name,
  COUNT(CASE WHEN cr.sender_id = u.id THEN 1 END) as recommendations_sent,
  COUNT(CASE WHEN cr.recipient_id = u.id THEN 1 END) as recommendations_received,
  COUNT(CASE WHEN cr.recipient_id = u.id AND cr.status = 'accepted' THEN 1 END) as recommendations_accepted,
  COUNT(CASE WHEN cr.recipient_id = u.id AND cr.status = 'watched' THEN 1 END) as recommendations_watched,
  AVG(CASE WHEN cr.sender_id = u.id AND cr.personal_rating IS NOT NULL THEN cr.personal_rating END) as avg_rating_given,
  MAX(cr.created_at) as last_recommendation_date
FROM users u
LEFT JOIN content_recommendations cr ON (u.id = cr.sender_id OR u.id = cr.recipient_id)
GROUP BY u.id, u.display_name;

-- Grant access to the view
GRANT SELECT ON recommendation_stats TO authenticated;

-- Create notification triggers (placeholder for notification system integration)
CREATE OR REPLACE FUNCTION notify_recommendation_created()
RETURNS TRIGGER AS $$
BEGIN
  -- This would integrate with your notification system
  -- For now, it's a placeholder that does nothing
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_recommendation_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- This would integrate with your notification system
  -- Only notify on status changes
  IF OLD.status != NEW.status THEN
    -- Placeholder for notification logic
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
DROP TRIGGER IF EXISTS recommendation_created_notify ON content_recommendations;
CREATE TRIGGER recommendation_created_notify
  AFTER INSERT ON content_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION notify_recommendation_created();

DROP TRIGGER IF EXISTS recommendation_status_changed_notify ON content_recommendations;
CREATE TRIGGER recommendation_status_changed_notify
  AFTER UPDATE ON content_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION notify_recommendation_status_changed();

-- Sample data (optional, for testing)
-- Uncomment the following lines to add sample data

/*
-- Insert sample recommendations (assuming you have test users)
INSERT INTO content_recommendations (sender_id, recipient_id, tmdb_id, media_type, message, personal_rating, is_urgent, tags)
VALUES 
  -- Replace with actual user IDs from your users table
  ('user-id-1', 'user-id-2', 550, 'movie', 'You have to watch this! One of the best thrillers ever made.', 9.5, true, ARRAY['thriller', 'classic', 'must-watch']),
  ('user-id-2', 'user-id-1', 1399, 'tv', 'Perfect for our next binge watch session. The character development is incredible!', 9.0, false, ARRAY['drama', 'binge-watch', 'character-driven']);
*/