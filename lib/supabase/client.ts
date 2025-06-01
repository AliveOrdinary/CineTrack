import { createBrowserClient } from '@supabase/ssr'

// Ensure you have a types/database.ts file generated from your Supabase schema
// For now, we'll use a generic type.
// import { Database } from '@/types/database' 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_URL")
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)

// Replace `any` with `Database` once your types are generated
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Watched Content Operations
export interface WatchedContentEntry {
  id?: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  watched_date?: string;
  user_rating?: number;
  is_rewatch?: boolean;
  rewatch_count?: number;
  notes?: string;
  contains_spoilers?: boolean;
  visibility?: 'public' | 'followers' | 'private';
  posted_as_review?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function addWatchedContent(entry: Omit<WatchedContentEntry, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watched_content')
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWatchedContent(id: string, updates: Partial<WatchedContentEntry>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watched_content')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWatchedContent(userId: string, tmdbId: number, mediaType: 'movie' | 'tv') {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watched_content')
    .select('*')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .order('watched_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserWatchedContent(userId: string, limit?: number) {
  const supabase = createClient();
  
  let query = supabase
    .from('watched_content')
    .select('*')
    .eq('user_id', userId)
    .order('watched_date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function removeWatchedContent(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('watched_content')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Watchlist Operations
export interface WatchlistEntry {
  id?: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  priority?: number; // 0=None, 1=Low, 2=Medium, 3=High
  added_date?: string;
  notes?: string;
  visibility?: 'public' | 'followers' | 'private';
}

export async function addToWatchlist(entry: Omit<WatchlistEntry, 'id' | 'added_date'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watchlist_content')
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromWatchlist(userId: string, tmdbId: number, mediaType: 'movie' | 'tv') {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('watchlist_content')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (error) throw error;
}

export async function updateWatchlistEntry(id: string, updates: Partial<WatchlistEntry>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watchlist_content')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWatchlistEntry(userId: string, tmdbId: number, mediaType: 'movie' | 'tv') {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watchlist_content')
    .select('*')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
}

export async function getUserWatchlist(userId: string, sortBy: 'added_date' | 'priority' = 'added_date', ascending: boolean = false) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('watchlist_content')
    .select('*')
    .eq('user_id', userId)
    .order(sortBy, { ascending });

  if (error) throw error;
  return data;
}

export async function fixDependencies() {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('watchlist_content')
    .update({ dependencies: [] })
    .is('dependencies', null);

  if (error) throw error;
}

// Profile Operations
export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserStats {
  moviesWatched: number;
  tvShowsWatched: number;
  reviewsWritten: number;
  watchlistItems: number;
  customLists: number;
}

export interface ActivityItem {
  id: string;
  type: 'watched' | 'review' | 'watchlist' | 'list';
  tmdb_id?: number;
  media_type?: 'movie' | 'tv';
  title?: string;
  action?: string;
  created_at: string;
  details?: any;
}

export async function getUserProfile(userId?: string) {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('getUserProfile error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
  return data as UserProfile;
}

export async function updateUserProfile(updates: Partial<UserProfile>) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function getUserStats(userId?: string): Promise<UserStats> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }

  // Get watched content count
  const { count: moviesWatched } = await supabase
    .from('watched_content')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('media_type', 'movie');

  const { count: tvShowsWatched } = await supabase
    .from('watched_content')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('media_type', 'tv');

  // Get reviews count (when reviews table exists)
  let reviewsWritten = 0;
  try {
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    reviewsWritten = count || 0;
  } catch (error) {
    // Reviews table doesn't exist yet
    reviewsWritten = 0;
  }

  // Get watchlist count
  const { count: watchlistItems } = await supabase
    .from('watchlist_content')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get custom lists count (when custom_lists table exists)
  let customLists = 0;
  try {
    const { count } = await supabase
      .from('custom_lists')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId);
    customLists = count || 0;
  } catch (error) {
    // Custom lists table doesn't exist yet
    customLists = 0;
  }

  return {
    moviesWatched: moviesWatched || 0,
    tvShowsWatched: tvShowsWatched || 0,
    reviewsWritten,
    watchlistItems: watchlistItems || 0,
    customLists,
  };
}

export async function getUserActivity(userId?: string, limit = 10): Promise<ActivityItem[]> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }

  // Get recent watched content
  const { data: watchedData } = await supabase
    .from('watched_content')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Get recent watchlist additions
  const { data: watchlistData } = await supabase
    .from('watchlist_content')
    .select('*')
    .eq('user_id', userId)
    .order('added_date', { ascending: false })
    .limit(limit);

  // Combine and format activity items
  const activities: ActivityItem[] = [];

  if (watchedData) {
    watchedData.forEach(item => {
      activities.push({
        id: `watched-${item.id}`,
        type: 'watched',
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        action: 'marked as watched',
        created_at: item.created_at,
        details: { rating: item.rating, rewatch_count: item.rewatch_count }
      });
    });
  }

  if (watchlistData) {
    watchlistData.forEach(item => {
      activities.push({
        id: `watchlist-${item.id}`,
        type: 'watchlist',
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        action: 'added to watchlist',
        created_at: item.added_date,
        details: { priority: item.priority }
      });
    });
  }

  // Sort by date and limit
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// Custom Lists Operations
export interface CustomList {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  visibility?: 'public' | 'followers' | 'private';
  banner_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ListItem {
  id?: string;
  list_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  sort_order?: number;
  notes?: string;
  added_at?: string;
}

export interface CustomListWithItems extends CustomList {
  items?: ListItem[];
  item_count?: number;
}

export async function createCustomList(list: Omit<CustomList, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('custom_lists')
    .insert([list])
    .select()
    .single();

  if (error) {
    console.error('createCustomList error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to create custom list: ${error.message}`);
  }
  return data as CustomList;
}

export async function updateCustomList(id: string, updates: Partial<CustomList>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('custom_lists')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CustomList;
}

export async function deleteCustomList(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('custom_lists')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getUserCustomLists(userId?: string): Promise<CustomListWithItems[]> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('custom_lists')
    .select(`
      *,
      list_items(count)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getUserCustomLists error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to get user custom lists: ${error.message}`);
  }
  
  return data.map(list => ({
    ...list,
    item_count: list.list_items?.[0]?.count || 0
  })) as CustomListWithItems[];
}

export async function getCustomListWithItems(listId: string): Promise<CustomListWithItems> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('custom_lists')
    .select(`
      *,
      list_items(*)
    `)
    .eq('id', listId)
    .single();

  if (error) throw error;
  
  return {
    ...data,
    items: data.list_items || []
  } as CustomListWithItems;
}

export async function addItemToList(item: Omit<ListItem, 'id' | 'added_at'>) {
  const supabase = createClient();
  
  // Get the next sort order
  const { data: lastItem } = await supabase
    .from('list_items')
    .select('sort_order')
    .eq('list_id', item.list_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (lastItem?.sort_order || 0) + 1;
  
  const { data, error } = await supabase
    .from('list_items')
    .insert([{
      ...item,
      sort_order: nextSortOrder
    }])
    .select()
    .single();

  if (error) throw error;
  return data as ListItem;
}

export async function removeItemFromList(listId: string, tmdbId: number, mediaType: 'movie' | 'tv') {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('list_items')
    .delete()
    .eq('list_id', listId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);

  if (error) throw error;
}

export async function updateListItemOrder(listId: string, itemUpdates: { id: string; sort_order: number }[]) {
  const supabase = createClient();
  
  // Update items in batch
  const promises = itemUpdates.map(({ id, sort_order }) =>
    supabase
      .from('list_items')
      .update({ sort_order })
      .eq('id', id)
      .eq('list_id', listId)
  );

  const results = await Promise.all(promises);
  
  // Check for errors
  for (const result of results) {
    if (result.error) throw result.error;
  }
}

export async function updateListItem(id: string, updates: Partial<ListItem>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('list_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ListItem;
}

export async function checkItemInList(listId: string, tmdbId: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('list_items')
    .select('id')
    .eq('list_id', listId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return !!data;
}

// Review Operations
export interface Review {
  id?: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  content: string;
  rating?: number; // 1-10 scale
  is_spoiler?: boolean;
  is_anonymous?: boolean;
  likes_count?: number;
  comments_count?: number;
  visibility?: 'public' | 'followers' | 'private';
  watched_content_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewWithUser extends Review {
  users?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export async function createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'likes_count' | 'comments_count'>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

export async function updateReview(id: string, updates: Partial<Review>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Review;
}

export async function deleteReview(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getUserReview(userId: string, tmdbId: number, mediaType: 'movie' | 'tv') {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data as Review | null;
}

export async function getContentReviews(tmdbId: number, mediaType: 'movie' | 'tv', limit = 10): Promise<ReviewWithUser[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as ReviewWithUser[];
}

export async function getUserReviews(userId?: string, limit = 10): Promise<ReviewWithUser[]> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }
  
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as ReviewWithUser[];
}

// Storage Operations for List Banners
export async function uploadListBanner(listId: string, file: File): Promise<string> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create unique filename with user ID folder structure
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${listId}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('list-banners')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('list-banners')
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteListBanner(bannerUrl: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Extract file path from URL
  const url = new URL(bannerUrl);
  const pathParts = url.pathname.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from('list-banners')
    .remove([filePath]);

  if (error) throw error;
}

export async function getListBannerUrl(listId: string): Promise<string | null> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // List files in user's folder
  const { data, error } = await supabase.storage
    .from('list-banners')
    .list(user.id, {
      limit: 100,
      search: listId
    });

  if (error || !data || data.length === 0) return null;

  // Find the banner for this list
  const bannerFile = data.find(file => file.name.startsWith(`${listId}-`));
  if (!bannerFile) return null;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('list-banners')
    .getPublicUrl(`${user.id}/${bannerFile.name}`);

  return publicUrl;
}

// Review Interaction Operations
export interface ReviewLike {
  id?: string;
  user_id: string;
  review_id: string;
  created_at?: string;
}

export interface ReviewComment {
  id?: string;
  user_id: string;
  review_id: string;
  parent_comment_id?: string;
  content: string;
  is_edited?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReviewCommentWithUser extends ReviewComment {
  users?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
  replies?: ReviewCommentWithUser[];
}

// Like/Unlike functionality
export async function likeReview(reviewId: string): Promise<ReviewLike> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('review_likes')
    .insert([{
      user_id: user.id,
      review_id: reviewId
    }])
    .select()
    .single();

  if (error) throw error;
  return data as ReviewLike;
}

export async function unlikeReview(reviewId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('review_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('review_id', reviewId);

  if (error) throw error;
}

export async function checkUserLikedReview(reviewId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('review_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('review_id', reviewId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function getReviewLikes(reviewId: string): Promise<ReviewLike[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('review_likes')
    .select('*')
    .eq('review_id', reviewId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as ReviewLike[];
}

// Comment functionality
export async function createReviewComment(comment: Omit<ReviewComment, 'id' | 'created_at' | 'updated_at' | 'is_edited' | 'user_id'>): Promise<ReviewCommentWithUser> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('review_comments')
    .insert([{
      ...comment,
      user_id: user.id
    }])
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data as ReviewCommentWithUser;
}

export async function updateReviewComment(commentId: string, content: string): Promise<ReviewCommentWithUser> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('review_comments')
    .update({ content })
    .eq('id', commentId)
    .eq('user_id', user.id)
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .single();

  if (error) throw error;
  return data as ReviewCommentWithUser;
}

export async function deleteReviewComment(commentId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('review_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) throw error;
}

export async function getReviewComments(reviewId: string): Promise<ReviewCommentWithUser[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('review_comments')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .eq('review_id', reviewId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    (data as ReviewCommentWithUser[]).map(async (comment) => {
      const replies = await getCommentReplies(comment.id!);
      return { ...comment, replies };
    })
  );

  return commentsWithReplies;
}

export async function getCommentReplies(parentCommentId: string): Promise<ReviewCommentWithUser[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('review_comments')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .eq('parent_comment_id', parentCommentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as ReviewCommentWithUser[];
}

// Follow System Operations
export interface Follow {
  follower_id: string;
  following_id: string;
  created_at?: string;
}

export interface UserWithFollowStatus {
  id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  is_following?: boolean;
  is_followed_by?: boolean;
  followers_count?: number;
  following_count?: number;
}

// Follow/Unfollow functionality
export async function followUser(followingId: string): Promise<Follow> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (user.id === followingId) {
    throw new Error('Cannot follow yourself');
  }

  const { data, error } = await supabase
    .from('follows')
    .insert([{
      follower_id: user.id,
      following_id: followingId
    }])
    .select()
    .single();

  if (error) throw error;
  return data as Follow;
}

export async function unfollowUser(followingId: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId);

  if (error) throw error;
}

export async function checkUserFollowStatus(userId: string): Promise<{ isFollowing: boolean; isFollowedBy: boolean }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isFollowing: false, isFollowedBy: false };

  if (user.id === userId) {
    return { isFollowing: false, isFollowedBy: false };
  }

  // Check if current user follows the target user
  const { data: followingData } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .single();

  // Check if target user follows the current user
  const { data: followerData } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', userId)
    .eq('following_id', user.id)
    .single();

  return {
    isFollowing: !!followingData,
    isFollowedBy: !!followerData
  };
}

export async function getUserFollowers(userId: string, limit = 50): Promise<UserWithFollowStatus[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower_id,
      created_at,
      users!follows_follower_id_fkey(id, display_name, avatar_url, bio, created_at)
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Get current user's follow status for each follower
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  const followersWithStatus = await Promise.all(
    data.map(async (follow: any) => {
      const follower = follow.users;
      let followStatus = { isFollowing: false, isFollowedBy: false };
      
      if (currentUserId && currentUserId !== follower.id) {
        followStatus = await checkUserFollowStatus(follower.id);
      }

      return {
        ...follower,
        is_following: followStatus.isFollowing,
        is_followed_by: followStatus.isFollowedBy
      } as UserWithFollowStatus;
    })
  );

  return followersWithStatus;
}

export async function getUserFollowing(userId: string, limit = 50): Promise<UserWithFollowStatus[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following_id,
      created_at,
      users!follows_following_id_fkey(id, display_name, avatar_url, bio, created_at)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Get current user's follow status for each following
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  const followingWithStatus = await Promise.all(
    data.map(async (follow: any) => {
      const following = follow.users;
      let followStatus = { isFollowing: false, isFollowedBy: false };
      
      if (currentUserId && currentUserId !== following.id) {
        followStatus = await checkUserFollowStatus(following.id);
      }

      return {
        ...following,
        is_following: followStatus.isFollowing,
        is_followed_by: followStatus.isFollowedBy
      } as UserWithFollowStatus;
    })
  );

  return followingWithStatus;
}

export async function getUserFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
  const supabase = createClient();
  
  // Get followers count
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  // Get following count
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  return {
    followersCount: followersCount || 0,
    followingCount: followingCount || 0
  };
}

// Activity feed for followed users
export async function getFollowingActivity(limit = 20): Promise<ActivityItem[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get list of users the current user follows
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (!followingData || followingData.length === 0) {
    return [];
  }

  const followingIds = followingData.map(f => f.following_id);

  // Get recent activity from followed users
  const activities: ActivityItem[] = [];

  // Get watched content from followed users
  const { data: watchedData } = await supabase
    .from('watched_content')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .in('user_id', followingIds)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (watchedData) {
    watchedData.forEach(item => {
      activities.push({
        id: `watched-${item.id}`,
        type: 'watched',
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        action: 'marked as watched',
        created_at: item.created_at,
        details: { 
          rating: item.user_rating, 
          rewatch_count: item.rewatch_count,
          user: item.users
        }
      });
    });
  }

  // Get reviews from followed users
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .in('user_id', followingIds)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (reviewsData) {
    reviewsData.forEach(item => {
      activities.push({
        id: `review-${item.id}`,
        type: 'review',
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        action: 'wrote a review',
        created_at: item.created_at,
        details: { 
          rating: item.rating,
          is_spoiler: item.is_spoiler,
          user: item.users
        }
      });
    });
  }

  // Get watchlist additions from followed users
  const { data: watchlistData } = await supabase
    .from('watchlist_content')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .in('user_id', followingIds)
    .eq('visibility', 'public')
    .order('added_date', { ascending: false })
    .limit(limit);

  if (watchlistData) {
    watchlistData.forEach(item => {
      activities.push({
        id: `watchlist-${item.id}`,
        type: 'watchlist',
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        action: 'added to watchlist',
        created_at: item.added_date,
        details: { 
          priority: item.priority,
          user: item.users
        }
      });
    });
  }

  // Get custom list activities from followed users
  const { data: listsData } = await supabase
    .from('custom_lists')
    .select(`
      *,
      users!inner(id, display_name, avatar_url)
    `)
    .in('user_id', followingIds)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (listsData) {
    listsData.forEach(item => {
      activities.push({
        id: `list-${item.id}`,
        type: 'list',
        action: 'created a list',
        created_at: item.created_at,
        details: { 
          user: item.users,
          list_name: item.name,
          list_description: item.description,
          list_id: item.id
        }
      });
    });
  }

  // Sort by date and limit
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// Enhanced activity feed with filtering
export async function getFilteredActivity(
  activityTypes: string[] = ['watched', 'review', 'watchlist', 'list'],
  limit = 20,
  offset = 0
): Promise<{ activities: ActivityItem[]; hasMore: boolean }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get list of users the current user follows
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (!followingData || followingData.length === 0) {
    return { activities: [], hasMore: false };
  }

  const followingIds = followingData.map(f => f.following_id);
  const activities: ActivityItem[] = [];

  // Fetch activities based on selected types
  const promises = [];

  if (activityTypes.includes('watched')) {
    promises.push(
      supabase
        .from('watched_content')
        .select(`
          *,
          users!inner(id, display_name, avatar_url)
        `)
        .in('user_id', followingIds)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    );
  }

  if (activityTypes.includes('review')) {
    promises.push(
      supabase
        .from('reviews')
        .select(`
          *,
          users!inner(id, display_name, avatar_url)
        `)
        .in('user_id', followingIds)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    );
  }

  if (activityTypes.includes('watchlist')) {
    promises.push(
      supabase
        .from('watchlist_content')
        .select(`
          *,
          users!inner(id, display_name, avatar_url)
        `)
        .in('user_id', followingIds)
        .eq('visibility', 'public')
        .order('added_date', { ascending: false })
        .range(offset, offset + limit - 1)
    );
  }

  if (activityTypes.includes('list')) {
    promises.push(
      supabase
        .from('custom_lists')
        .select(`
          *,
          users!inner(id, display_name, avatar_url)
        `)
        .in('user_id', followingIds)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
    );
  }

  const results = await Promise.all(promises);
  
  // Process results and create activity items
  results.forEach((result, index) => {
    if (result.data) {
      const activityType = activityTypes[index];
      result.data.forEach((item: any) => {
        let activity: ActivityItem;
        
        switch (activityType) {
          case 'watched':
            activity = {
              id: `watched-${item.id}`,
              type: 'watched',
              tmdb_id: item.tmdb_id,
              media_type: item.media_type,
              action: 'marked as watched',
              created_at: item.created_at,
              details: { 
                rating: item.user_rating, 
                rewatch_count: item.rewatch_count,
                user: item.users
              }
            };
            break;
          case 'review':
            activity = {
              id: `review-${item.id}`,
              type: 'review',
              tmdb_id: item.tmdb_id,
              media_type: item.media_type,
              action: 'wrote a review',
              created_at: item.created_at,
              details: { 
                rating: item.rating,
                is_spoiler: item.is_spoiler,
                user: item.users,
                content: item.content
              }
            };
            break;
          case 'watchlist':
            activity = {
              id: `watchlist-${item.id}`,
              type: 'watchlist',
              tmdb_id: item.tmdb_id,
              media_type: item.media_type,
              action: 'added to watchlist',
              created_at: item.added_date,
              details: { 
                priority: item.priority,
                user: item.users
              }
            };
            break;
          case 'list':
            activity = {
              id: `list-${item.id}`,
              type: 'list',
              action: 'created a list',
              created_at: item.created_at,
              details: { 
                user: item.users,
                list_name: item.name,
                list_description: item.description,
                list_id: item.id
              }
            };
            break;
          default:
            return;
        }
        
        activities.push(activity);
      });
    }
  });

  // Sort by date
  const sortedActivities = activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  // Check if there are more activities
  const hasMore = sortedActivities.length === limit;

  return { activities: sortedActivities, hasMore };
}

// Search users for following
export async function searchUsers(query: string, limit = 20): Promise<UserWithFollowStatus[]> {
  const supabase = createClient();
  
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, bio, created_at')
    .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;

  // Get current user's follow status for each user
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  const usersWithStatus = await Promise.all(
    data.map(async (searchUser) => {
      let followStatus = { isFollowing: false, isFollowedBy: false };
      let followCounts = { followersCount: 0, followingCount: 0 };
      
      if (currentUserId && currentUserId !== searchUser.id) {
        followStatus = await checkUserFollowStatus(searchUser.id);
      }
      
      followCounts = await getUserFollowCounts(searchUser.id);

      return {
        ...searchUser,
        is_following: followStatus.isFollowing,
        is_followed_by: followStatus.isFollowedBy,
        followers_count: followCounts.followersCount,
        following_count: followCounts.followingCount
      } as UserWithFollowStatus;
    })
  );

  return usersWithStatus;
}

// Episode Tracking Operations
export interface EpisodeTracking {
  id?: string;
  user_id: string;
  tmdb_tv_id: number;
  season_number: number;
  episode_number: number;
  watched_date?: string;
  rating?: number; // 1-10 scale
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SeasonProgress {
  season_number: number;
  total_episodes: number;
  watched_episodes: number;
  percentage: number;
}

export interface TvShowProgress {
  tmdb_tv_id: number;
  total_episodes: number;
  watched_episodes: number;
  seasons: SeasonProgress[];
  next_episode?: {
    season_number: number;
    episode_number: number;
  };
}

// Mark episode as watched
export async function markEpisodeWatched(episode: Omit<EpisodeTracking, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<EpisodeTracking> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('episode_tracking')
    .upsert([{
      ...episode,
      user_id: user.id,
      watched_date: episode.watched_date || new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data as EpisodeTracking;
}

// Unmark episode as watched
export async function unmarkEpisodeWatched(tmdbTvId: number, seasonNumber: number, episodeNumber: number): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('episode_tracking')
    .delete()
    .eq('user_id', user.id)
    .eq('tmdb_tv_id', tmdbTvId)
    .eq('season_number', seasonNumber)
    .eq('episode_number', episodeNumber);

  if (error) throw error;
}

// Update episode tracking
export async function updateEpisodeTracking(id: string, updates: Partial<EpisodeTracking>): Promise<EpisodeTracking> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('episode_tracking')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as EpisodeTracking;
}

// Get watched episodes for a TV show
export async function getWatchedEpisodes(tmdbTvId: number, userId?: string): Promise<EpisodeTracking[]> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('episode_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('tmdb_tv_id', tmdbTvId)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });

  if (error) throw error;
  return data as EpisodeTracking[];
}

// Get watched episodes for a specific season
export async function getWatchedEpisodesForSeason(tmdbTvId: number, seasonNumber: number, userId?: string): Promise<EpisodeTracking[]> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('episode_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('tmdb_tv_id', tmdbTvId)
    .eq('season_number', seasonNumber)
    .order('episode_number', { ascending: true });

  if (error) throw error;
  return data as EpisodeTracking[];
}

// Check if episode is watched
export async function isEpisodeWatched(tmdbTvId: number, seasonNumber: number, episodeNumber: number, userId?: string): Promise<boolean> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('episode_tracking')
    .select('id')
    .eq('user_id', userId)
    .eq('tmdb_tv_id', tmdbTvId)
    .eq('season_number', seasonNumber)
    .eq('episode_number', episodeNumber)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return !!data;
}

// Get TV show progress
export async function getTvShowProgress(tmdbTvId: number, totalSeasons: number, episodesPerSeason: Record<number, number>, userId?: string): Promise<TvShowProgress> {
  const supabase = createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    userId = user.id;
  }

  const watchedEpisodes = await getWatchedEpisodes(tmdbTvId, userId);
  
  // Calculate season progress
  const seasons: SeasonProgress[] = [];
  let totalEpisodes = 0;
  
  for (let seasonNum = 1; seasonNum <= totalSeasons; seasonNum++) {
    const seasonEpisodeCount = episodesPerSeason[seasonNum] || 0;
    const watchedInSeason = watchedEpisodes.filter(ep => ep.season_number === seasonNum).length;
    
    seasons.push({
      season_number: seasonNum,
      total_episodes: seasonEpisodeCount,
      watched_episodes: watchedInSeason,
      percentage: seasonEpisodeCount > 0 ? (watchedInSeason / seasonEpisodeCount) * 100 : 0
    });
    
    totalEpisodes += seasonEpisodeCount;
  }

  // Find next episode to watch
  let nextEpisode: { season_number: number; episode_number: number } | undefined;
  
  for (const season of seasons) {
    if (season.watched_episodes < season.total_episodes) {
      const watchedInSeason = watchedEpisodes.filter(ep => ep.season_number === season.season_number);
      const watchedEpisodeNumbers = watchedInSeason.map(ep => ep.episode_number).sort((a, b) => a - b);
      
      // Find first unwatched episode in this season
      for (let episodeNum = 1; episodeNum <= season.total_episodes; episodeNum++) {
        if (!watchedEpisodeNumbers.includes(episodeNum)) {
          nextEpisode = {
            season_number: season.season_number,
            episode_number: episodeNum
          };
          break;
        }
      }
      break;
    }
  }

  return {
    tmdb_tv_id: tmdbTvId,
    total_episodes: totalEpisodes,
    watched_episodes: watchedEpisodes.length,
    seasons,
    next_episode: nextEpisode
  };
}

// Bulk mark episodes as watched (for entire season)
export async function markSeasonWatched(tmdbTvId: number, seasonNumber: number, episodeCount: number): Promise<EpisodeTracking[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const episodes: Omit<EpisodeTracking, 'id' | 'created_at' | 'updated_at'>[] = [];
  
  for (let episodeNum = 1; episodeNum <= episodeCount; episodeNum++) {
    episodes.push({
      user_id: user.id,
      tmdb_tv_id: tmdbTvId,
      season_number: seasonNumber,
      episode_number: episodeNum,
      watched_date: new Date().toISOString()
    });
  }

  const { data, error } = await supabase
    .from('episode_tracking')
    .upsert(episodes)
    .select();

  if (error) throw error;
  return data as EpisodeTracking[];
}

// Bulk unmark episodes as watched (for entire season)
export async function unmarkSeasonWatched(tmdbTvId: number, seasonNumber: number): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('episode_tracking')
    .delete()
    .eq('user_id', user.id)
    .eq('tmdb_tv_id', tmdbTvId)
    .eq('season_number', seasonNumber);

  if (error) throw error;
} 