-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT USING (true); -- Allow viewing all profiles (adjust privacy later)

-- Follows table policies
CREATE POLICY "Users can view their own follows" ON follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage their own follows" ON follows
  FOR ALL USING (auth.uid() = follower_id);

-- Watched content policies
CREATE POLICY "Users can manage their own watched content" ON watched_content
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public watched content" ON watched_content
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

-- Reviews table policies
CREATE POLICY "Users can manage their own reviews" ON reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public reviews" ON reviews
  FOR SELECT USING (
    (visibility = 'public' AND NOT anonymous) OR 
    auth.uid() = user_id
  );

-- Watchlist content policies
CREATE POLICY "Users can manage their own watchlist" ON watchlist_content
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public watchlists" ON watchlist_content
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

-- Custom lists policies
CREATE POLICY "Users can manage their own lists" ON custom_lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public lists" ON custom_lists
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

-- List items policies
CREATE POLICY "Users can manage items in their own lists" ON list_items
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM custom_lists WHERE id = list_id)
  );

CREATE POLICY "Users can view items in public lists" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_lists 
      WHERE id = list_id 
      AND (visibility = 'public' OR user_id = auth.uid())
    )
  ); 