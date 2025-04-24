-- Enum type for report status
CREATE TYPE public.report_status AS ENUM (
    'pending',
    'resolved',
    'dismissed'
);

-- Table definition for content reports
CREATE TABLE public.content_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL, -- Keep report even if reporter deleted
    reported_content_type TEXT NOT NULL CHECK (reported_content_type IN ('review', 'comment')), -- Extend as needed
    reported_content_id UUID NOT NULL, -- Assuming reviews/comments use UUID IDs
    -- Add FK constraint if comments table exists: FOREIGN KEY (reported_content_id) REFERENCES public.review_comments(id) ON DELETE CASCADE,
    -- Add FK constraint for reviews: FOREIGN KEY (reported_content_id) REFERENCES public.reviews(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (char_length(reason) > 0),
    status public.report_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by_admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Add comment for clarity
COMMENT ON COLUMN public.content_reports.reported_content_id IS 'ID of the specific content being reported (e.g., review ID, comment ID)';

-- Add FK constraint specifically for reviews (adjust if comment ID is different)
-- Assuming 'reviews' table exists and uses UUID for 'id'
ALTER TABLE public.content_reports 
ADD CONSTRAINT fk_reported_review 
FOREIGN KEY (reported_content_id) 
REFERENCES public.reviews(id) 
ON DELETE CASCADE;
-- Note: Add similar constraint if comments reporting is needed and the table exists

-- Enable RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow authenticated users to create reports
CREATE POLICY "Allow authenticated users to create reports" ON public.content_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_user_id);

-- Allow admins to view all reports
CREATE POLICY "Allow admins to view all reports" ON public.content_reports
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid())); -- Assumes is_admin function exists

-- Allow admins to update report status and resolution details
CREATE POLICY "Allow admins to update reports" ON public.content_reports
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Optional: Allow reporters to view their own submitted reports (read-only)
-- CREATE POLICY "Allow reporters to view their own reports" ON public.content_reports
-- FOR SELECT
-- TO authenticated
-- USING (auth.uid() = reporter_user_id);
