-- Create episode_tracking table
CREATE TABLE episode_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_tv_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    watched_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique episode tracking per user
    UNIQUE(user_id, tmdb_tv_id, season_number, episode_number)
);

-- Create indexes for better performance
CREATE INDEX idx_episode_tracking_user_id ON episode_tracking(user_id);
CREATE INDEX idx_episode_tracking_tv_id ON episode_tracking(tmdb_tv_id);
CREATE INDEX idx_episode_tracking_user_tv ON episode_tracking(user_id, tmdb_tv_id);
CREATE INDEX idx_episode_tracking_season ON episode_tracking(tmdb_tv_id, season_number);

-- Enable RLS
ALTER TABLE episode_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own episode tracking" ON episode_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own episode tracking" ON episode_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own episode tracking" ON episode_tracking
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own episode tracking" ON episode_tracking
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_episode_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_episode_tracking_updated_at
    BEFORE UPDATE ON episode_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_episode_tracking_updated_at(); 