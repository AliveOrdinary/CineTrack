-- Seed data for testing

-- Insert some test users
INSERT INTO public.users (email, display_name, avatar_url, bio, region, role)
VALUES
  ('test1@example.com', 'Test User 1', 'https://i.pravatar.cc/150?u=test1', 'I love movies!', 'US', 'user'),
  ('test2@example.com', 'Test User 2', 'https://i.pravatar.cc/150?u=test2', 'TV show enthusiast', 'UK', 'user'),
  ('admin@example.com', 'Admin User', 'https://i.pravatar.cc/150?u=admin', 'Site administrator', 'US', 'admin');

-- Insert some test movies in the watchlist
INSERT INTO public.watchlist_content (user_id, tmdb_id, media_type, priority, added_date)
VALUES
  ((SELECT id FROM public.users WHERE email = 'test1@example.com'), 550, 'movie', 1, NOW()),  -- Fight Club
  ((SELECT id FROM public.users WHERE email = 'test1@example.com'), 238, 'movie', 2, NOW()),  -- The Godfather
  ((SELECT id FROM public.users WHERE email = 'test2@example.com'), 1396, 'tv', 1, NOW()),    -- Breaking Bad
  ((SELECT id FROM public.users WHERE email = 'test2@example.com'), 66732, 'tv', 2, NOW());   -- Stranger Things

-- Insert some test watched content
INSERT INTO public.watched_content (user_id, tmdb_id, media_type, watched_date, user_rating, notes)
VALUES
  ((SELECT id FROM public.users WHERE email = 'test1@example.com'), 155, 'movie', NOW() - INTERVAL '7 days', 9, 'Excellent movie!'),  -- The Dark Knight
  ((SELECT id FROM public.users WHERE email = 'test2@example.com'), 1399, 'tv', NOW() - INTERVAL '14 days', 10, 'Best show ever!');   -- Game of Thrones

-- Insert some test reviews
INSERT INTO public.reviews (user_id, tmdb_id, media_type, content, rating, is_spoiler)
VALUES
  ((SELECT id FROM public.users WHERE email = 'test1@example.com'), 155, 'movie', 'Heath Ledger''s performance was incredible. One of the best superhero movies ever.', 9, false),
  ((SELECT id FROM public.users WHERE email = 'test2@example.com'), 1399, 'tv', 'Amazing story and characters, but the ending was disappointing.', 8, true);

-- Insert some test follows
INSERT INTO public.follows (follower_id, following_id)
VALUES
  ((SELECT id FROM public.users WHERE email = 'test1@example.com'), (SELECT id FROM public.users WHERE email = 'test2@example.com')),
  ((SELECT id FROM public.users WHERE email = 'test2@example.com'), (SELECT id FROM public.users WHERE email = 'test1@example.com')); 