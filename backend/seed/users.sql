-- Seed data for users table
-- Note: These users are for testing only and don't have actual auth accounts
-- For real authentication integration, use Supabase Auth

INSERT INTO public.users (id, username, full_name, avatar_url, created_at, updated_at)
VALUES 
  -- Admin user
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', 'https://i.pravatar.cc/150?u=admin', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
  
  -- Regular users
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'john@example.com', 'John Smith', 'https://i.pravatar.cc/150?u=john', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'emma@example.com', 'Emma Wilson', 'https://i.pravatar.cc/150?u=emma', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'sam@example.com', 'Sam Johnson', 'https://i.pravatar.cc/150?u=sam', NOW() - INTERVAL '15 days', NOW()),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'olivia@example.com', 'Olivia Davis', 'https://i.pravatar.cc/150?u=olivia', NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING; 