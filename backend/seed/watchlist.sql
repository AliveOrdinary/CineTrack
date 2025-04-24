-- Seed data for watchlist table
-- Popular movies and TV shows with their IDs from TMDB

INSERT INTO public.watchlist (id, user_id, media_id, media_type, title, poster_path, added_at)
VALUES
  -- John's watchlist (movies)
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380b11', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '299536', 'movie', 'Avengers: Infinity War', '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', NOW() - INTERVAL '20 days'),
  ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '299534', 'movie', 'Avengers: Endgame', '/or06FN3Dka5tukK1e9sl16pB3iy.jpg', NOW() - INTERVAL '19 days'),
  ('f3eebc99-9c0b-4ef8-bb6d-6bb9bd380b33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '245891', 'movie', 'John Wick', '/fZPSd91yGE9fCcCe6OoQr6E3Pd7.jpg', NOW() - INTERVAL '18 days'),
  
  -- Emma's watchlist (TV shows)
  ('f4eebc99-9c0b-4ef8-bb6d-6bb9bd380b44', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '1399', 'tv', 'Game of Thrones', '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg', NOW() - INTERVAL '15 days'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380b55', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '66732', 'tv', 'Stranger Things', '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', NOW() - INTERVAL '14 days'),
  ('f6eebc99-9c0b-4ef8-bb6d-6bb9bd380b66', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '1396', 'tv', 'Breaking Bad', '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', NOW() - INTERVAL '13 days'),
  
  -- Sam's watchlist (mixed)
  ('f7eebc99-9c0b-4ef8-bb6d-6bb9bd380b77', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '157336', 'movie', 'Interstellar', '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', NOW() - INTERVAL '10 days'),
  ('f8eebc99-9c0b-4ef8-bb6d-6bb9bd380b88', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '1402', 'tv', 'The Walking Dead', '/n0fOaV5HWh7mFNHvO8VFxLsaLwD.jpg', NOW() - INTERVAL '9 days'),
  
  -- Olivia's watchlist (new releases)
  ('f9eebc99-9c0b-4ef8-bb6d-6bb9bd380b99', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '240', 'movie', 'The Godfather: Part II', '/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg', NOW() - INTERVAL '5 days'),
  ('faeebc99-9c0b-4ef8-bb6d-6bb9bd380baa', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '278', 'movie', 'The Shawshank Redemption', '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', NOW() - INTERVAL '4 days'),
  ('fbeebc99-9c0b-4ef8-bb6d-6bb9bd380bbb', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '238', 'movie', 'The Godfather', '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', NOW() - INTERVAL '3 days'),
  
  -- Admin's watchlist (for testing)
  ('fceebc99-9c0b-4ef8-bb6d-6bb9bd380bcc', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '550', 'movie', 'Fight Club', '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', NOW() - INTERVAL '25 days'),
  ('fdeebc99-9c0b-4ef8-bb6d-6bb9bd380bdd', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '13', 'movie', 'Forrest Gump', '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', NOW() - INTERVAL '24 days')
ON CONFLICT (id) DO NOTHING; 