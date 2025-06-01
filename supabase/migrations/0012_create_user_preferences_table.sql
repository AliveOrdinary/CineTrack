-- Create user preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Theme preferences
  theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  
  -- Default visibility settings
  default_review_visibility VARCHAR(20) DEFAULT 'public' CHECK (default_review_visibility IN ('public', 'followers', 'private')),
  default_list_visibility VARCHAR(20) DEFAULT 'public' CHECK (default_list_visibility IN ('public', 'followers', 'private')),
  default_watchlist_visibility VARCHAR(20) DEFAULT 'public' CHECK (default_watchlist_visibility IN ('public', 'followers', 'private')),
  default_activity_visibility VARCHAR(20) DEFAULT 'public' CHECK (default_activity_visibility IN ('public', 'followers', 'private')),
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  notify_on_follow BOOLEAN DEFAULT true,
  notify_on_review_like BOOLEAN DEFAULT true,
  notify_on_review_comment BOOLEAN DEFAULT true,
  notify_on_list_like BOOLEAN DEFAULT true,
  notify_on_list_comment BOOLEAN DEFAULT true,
  notify_on_recommendation BOOLEAN DEFAULT true,
  notify_on_system_updates BOOLEAN DEFAULT true,
  
  -- Regional and language settings
  language VARCHAR(10) DEFAULT 'en',
  region VARCHAR(10) DEFAULT 'US',
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Content preferences
  adult_content BOOLEAN DEFAULT false,
  spoiler_protection BOOLEAN DEFAULT true,
  auto_mark_watched BOOLEAN DEFAULT false,
  
  -- Display preferences
  items_per_page INTEGER DEFAULT 20 CHECK (items_per_page BETWEEN 10 AND 100),
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY' CHECK (date_format IN ('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to ensure one preference record per user
CREATE UNIQUE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_theme ON user_preferences(theme);
CREATE INDEX idx_user_preferences_language ON user_preferences(language);
CREATE INDEX idx_user_preferences_region ON user_preferences(region);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create preferences when a user is created
CREATE TRIGGER trigger_create_default_user_preferences
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at(); 