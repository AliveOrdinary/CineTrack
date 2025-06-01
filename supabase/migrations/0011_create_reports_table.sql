-- Create reports table for content moderation
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_content_type VARCHAR(50) NOT NULL CHECK (reported_content_type IN ('review', 'list', 'user', 'comment')),
    reported_content_id UUID NOT NULL,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'spam',
        'harassment',
        'hate_speech',
        'inappropriate_content',
        'copyright_violation',
        'misinformation',
        'violence',
        'other'
    )),
    details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    moderator_notes TEXT,
    resolution_action VARCHAR(50) CHECK (resolution_action IN ('no_action', 'content_removed', 'user_warned', 'user_suspended', 'user_banned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_content_type_id ON reports(reported_content_type, reported_content_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_moderator_id ON reports(moderator_id);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON reports
    FOR SELECT USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Moderators can view all reports (assuming moderators have a role)
-- For now, we'll allow authenticated users to view reports they created
-- In production, this would be restricted to moderator roles

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_reports_updated_at_trigger
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Function to get report statistics
CREATE OR REPLACE FUNCTION get_report_stats()
RETURNS TABLE (
    total_reports BIGINT,
    pending_reports BIGINT,
    resolved_reports BIGINT,
    dismissed_reports BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_reports,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
        COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed_reports
    FROM reports;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 