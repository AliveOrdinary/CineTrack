-- Seed data for report_content table
-- Sample content reports for testing moderation features

INSERT INTO public.report_content (id, user_id, content_id, content_type, reason, status, created_at, resolved_at)
VALUES
  -- Pending reports
  ('r1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '12345', 'movie', 'Incorrect age rating information', 'pending', NOW() - INTERVAL '10 days', NULL),
  ('r2eebc99-9c0b-4ef8-bb6d-6bb9bd380c22', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '67890', 'tv', 'Inappropriate content description', 'pending', NOW() - INTERVAL '8 days', NULL),
  
  -- Resolved reports
  ('r3eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '54321', 'movie', 'Wrong genre classification', 'resolved', NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
  ('r4eebc99-9c0b-4ef8-bb6d-6bb9bd380c44', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '98765', 'tv', 'Incorrect release date', 'rejected', NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING; 