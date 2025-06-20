/**
 * Supabase List Likes and Cloning Client
 * Functions for managing list likes, cloning, and engagement metrics
 */

import { createClient } from '@/lib/supabase/client';
import {
  ListLike,
  ListLikeWithUser,
  ListClone,
  ListCloneRelationship,
  CreateListLikeInput,
  CreateListCloneInput,
  CustomListWithEngagement,
  ListEngagementStats,
  PopularList,
  UserLikedList,
  UserListInteractions,
  ListEngagementQueryOptions,
  CloneListResult,
  ListDiscoveryOptions,
  ListEngagementActivity,
} from '@/types/list-likes';

const supabase = createClient();

/**
 * Like a list
 */
export async function likeList(listId: string): Promise<ListLike> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to like a list');
  }

  // Check if list exists and is accessible
  const { data: list } = await supabase
    .from('custom_lists')
    .select('id, user_id, visibility')
    .eq('id', listId)
    .single();

  if (!list) {
    throw new Error('List not found');
  }

  if (list.user_id === user.id) {
    throw new Error('Cannot like your own list');
  }

  // Check if user can access this list
  if (list.visibility === 'private') {
    throw new Error('Cannot like a private list');
  }

  if (list.visibility === 'followers') {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', list.user_id)
      .single();

    if (!follow) {
      throw new Error('Cannot like this list - you must follow the creator');
    }
  }

  const { data, error } = await supabase
    .from('list_likes')
    .insert({
      user_id: user.id,
      list_id: listId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error liking list:', error);
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('You have already liked this list');
    }
    throw new Error('Failed to like list');
  }

  return data;
}

/**
 * Unlike a list
 */
export async function unlikeList(listId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to unlike a list');
  }

  const { error } = await supabase
    .from('list_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('list_id', listId);

  if (error) {
    console.error('Error unliking list:', error);
    throw new Error('Failed to unlike list');
  }
}

/**
 * Check if user has liked a list
 */
export async function hasLikedList(listId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('list_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('list_id', listId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking list like:', error);
    return false;
  }

  return !!data;
}

/**
 * Clone a list
 */
export async function cloneList(cloneInput: CreateListCloneInput): Promise<CloneListResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to clone a list');
  }

  // Get original list details
  const { data: originalList } = await supabase
    .from('custom_lists')
    .select('*')
    .eq('id', cloneInput.original_list_id)
    .single();

  if (!originalList) {
    throw new Error('Original list not found');
  }

  if (originalList.user_id === user.id) {
    throw new Error('Cannot clone your own list');
  }

  // Check if user can access this list
  if (originalList.visibility === 'private') {
    throw new Error('Cannot clone a private list');
  }

  if (originalList.visibility === 'followers') {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', originalList.user_id)
      .single();

    if (!follow) {
      throw new Error('Cannot clone this list - you must follow the creator');
    }
  }

  // Create the cloned list
  const { data: clonedList, error: createError } = await supabase
    .from('custom_lists')
    .insert({
      user_id: user.id,
      name: cloneInput.cloned_list_name,
      description: cloneInput.cloned_list_description,
      visibility: 'private', // Start as private, user can change later
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating cloned list:', createError);
    throw new Error('Failed to create cloned list');
  }

  // Create clone relationship record
  const { data: cloneRelationship, error: relationshipError } = await supabase
    .from('list_clones')
    .insert({
      original_list_id: cloneInput.original_list_id,
      cloned_list_id: clonedList.id,
      cloned_by_user_id: user.id,
      clone_notes: cloneInput.clone_notes,
      is_attribution_visible: cloneInput.is_attribution_visible ?? true,
    })
    .select()
    .single();

  if (relationshipError) {
    // Clean up the created list if relationship creation fails
    await supabase.from('custom_lists').delete().eq('id', clonedList.id);
    console.error('Error creating clone relationship:', relationshipError);
    throw new Error('Failed to create clone relationship');
  }

  let copiedItemsCount = 0;

  // Copy items if requested
  if (cloneInput.copy_items) {
    const { data: originalItems } = await supabase
      .from('list_items')
      .select('*')
      .eq('list_id', cloneInput.original_list_id)
      .order('sort_order', { ascending: true });

    if (originalItems && originalItems.length > 0) {
      const itemsToClone = originalItems.map((item, index) => ({
        list_id: clonedList.id,
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        sort_order: index + 1,
        notes: item.notes,
      }));

      const { data: clonedItems, error: itemsError } = await supabase
        .from('list_items')
        .insert(itemsToClone)
        .select();

      if (itemsError) {
        console.error('Error copying list items:', itemsError);
        // Don't fail the whole operation, just log the error
      } else {
        copiedItemsCount = clonedItems?.length || 0;
      }
    }
  }

  // Get the cloned list with engagement data
  const { data: clonedListWithEngagement } = await supabase
    .from('lists_with_engagement')
    .select('*')
    .eq('id', clonedList.id)
    .single();

  return {
    cloned_list: clonedListWithEngagement || clonedList,
    clone_relationship: cloneRelationship,
    copied_items_count: copiedItemsCount,
  };
}

/**
 * Get list likes with user information
 */
export async function getListLikes(
  listId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ListLikeWithUser[]> {
  const { data, error } = await supabase
    .from('list_likes')
    .select(`
      *,
      user:users(id, display_name, avatar_url)
    `)
    .eq('list_id', listId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching list likes:', error);
    throw new Error('Failed to fetch list likes');
  }

  return data || [];
}

/**
 * Get list engagement statistics
 */
export async function getListEngagementStats(listId: string): Promise<ListEngagementStats> {
  const { data, error } = await supabase.rpc('get_list_engagement_stats', {
    target_list_id: listId,
  });

  if (error) {
    console.error('Error fetching list engagement stats:', error);
    throw new Error('Failed to fetch list engagement stats');
  }

  return data?.[0] || {
    total_likes: 0,
    total_clones: 0,
    recent_likes: 0,
    recent_clones: 0,
    top_likers: [],
    clone_creators: [],
  };
}

/**
 * Get lists with engagement metrics
 */
export async function getListsWithEngagement(
  options: ListEngagementQueryOptions = {}
): Promise<CustomListWithEngagement[]> {
  const { filters, sort, pagination } = options;

  let query = supabase
    .from('lists_with_engagement')
    .select('*');

  // Apply filters
  if (filters?.visibility) {
    query = query.in('visibility', filters.visibility);
  }
  if (filters?.has_likes) {
    query = query.gt('total_likes', 0);
  }
  if (filters?.has_clones) {
    query = query.gt('total_clones', 0);
  }
  if (filters?.min_likes) {
    query = query.gte('total_likes', filters.min_likes);
  }
  if (filters?.min_clones) {
    query = query.gte('total_clones', filters.min_clones);
  }
  if (filters?.created_after) {
    query = query.gte('created_at', filters.created_after);
  }
  if (filters?.created_before) {
    query = query.lte('created_at', filters.created_before);
  }

  // Apply sorting
  const sortField = sort?.field || 'created_at';
  const sortDirection = sort?.direction || 'desc';
  query = query.order(sortField, { ascending: sortDirection === 'asc' });

  // Apply pagination
  if (pagination) {
    query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching lists with engagement:', error);
    throw new Error('Failed to fetch lists with engagement');
  }

  return data || [];
}

/**
 * Get popular lists
 */
export async function getPopularLists(
  limit: number = 20,
  offset: number = 0
): Promise<PopularList[]> {
  const { data, error } = await supabase
    .from('popular_lists')
    .select('*')
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching popular lists:', error);
    throw new Error('Failed to fetch popular lists');
  }

  return data || [];
}

/**
 * Get user's liked lists
 */
export async function getUserLikedLists(
  userId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<UserLikedList[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  const { data, error } = await supabase
    .from('user_liked_lists')
    .select('*')
    .eq('user_id', targetUserId)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user liked lists:', error);
    throw new Error('Failed to fetch user liked lists');
  }

  return data || [];
}

/**
 * Get list clone relationships
 */
export async function getListCloneRelationships(
  originalListId?: string,
  clonedListId?: string,
  userId?: string
): Promise<ListCloneRelationship[]> {
  let query = supabase
    .from('list_clone_relationships')
    .select('*')
    .order('created_at', { ascending: false });

  if (originalListId) {
    query = query.eq('original_list_id', originalListId);
  }
  if (clonedListId) {
    query = query.eq('cloned_list_id', clonedListId);
  }
  if (userId) {
    query = query.eq('cloned_by_user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching clone relationships:', error);
    throw new Error('Failed to fetch clone relationships');
  }

  return data || [];
}

/**
 * Get user's list interactions summary
 */
export async function getUserListInteractions(
  userId?: string
): Promise<UserListInteractions> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) {
    throw new Error('User must be authenticated or userId must be provided');
  }

  const targetUserId = userId || user?.id;

  // Get liked lists
  const likedLists = await getUserLikedLists(targetUserId);

  // Get cloned lists (lists this user has cloned)
  const clonedLists = await getListCloneRelationships(undefined, undefined, targetUserId);

  // Get lists cloned by others (this user's lists that were cloned)
  const { data: userLists } = await supabase
    .from('custom_lists')
    .select('id')
    .eq('user_id', targetUserId);

  const userListIds = userLists?.map(list => list.id) || [];
  
  const listsClonedByOthers: ListCloneRelationship[] = [];
  if (userListIds.length > 0) {
    const clonePromises = userListIds.map(listId => 
      getListCloneRelationships(listId)
    );
    const cloneResults = await Promise.all(clonePromises);
    cloneResults.forEach(clones => listsClonedByOthers.push(...clones));
  }

  // Calculate totals
  const totalLikesReceived = userLists?.reduce((sum, _) => {
    // This would need to be calculated from the lists_with_engagement view
    return sum; // Placeholder
  }, 0) || 0;

  const totalClonesReceived = listsClonedByOthers.length;
  const totalLikesGiven = likedLists.length;
  const totalClonesMade = clonedLists.length;

  return {
    liked_lists: likedLists,
    cloned_lists: clonedLists,
    lists_cloned_by_others: listsClonedByOthers,
    total_likes_received: totalLikesReceived,
    total_clones_received: totalClonesReceived,
    total_likes_given: totalLikesGiven,
    total_clones_made: totalClonesMade,
  };
}

/**
 * Discover lists based on category
 */
export async function discoverLists(
  options: ListDiscoveryOptions
): Promise<CustomListWithEngagement[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from('lists_with_engagement')
    .select('*')
    .eq('visibility', 'public');

  // Exclude own lists if requested
  if (options.exclude_own_lists && user) {
    query = query.neq('user_id', user.id);
  }

  // Apply category-specific filters
  switch (options.category) {
    case 'trending':
      query = query.order('popularity_score', { ascending: false });
      break;
    case 'most_liked':
      query = query.order('total_likes', { ascending: false }).gt('total_likes', 0);
      break;
    case 'most_cloned':
      query = query.order('total_clones', { ascending: false }).gt('total_clones', 0);
      break;
    case 'recently_created':
      query = query.order('created_at', { ascending: false });
      break;
    case 'recently_updated':
      query = query.order('updated_at', { ascending: false });
      break;
    case 'by_followers':
      if (user) {
        // Get following user IDs
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (following && following.length > 0) {
          const followingIds = following.map(f => f.following_id);
          query = query.in('user_id', followingIds);
        } else {
          return []; // User doesn't follow anyone
        }
      } else {
        return []; // Not authenticated
      }
      break;
  }

  // Apply time period filter for trending
  if (options.time_period && options.category === 'trending') {
    const timeMap = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      'all': 365 * 10, // 10 years
    };
    const daysAgo = timeMap[options.time_period];
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
    query = query.gte('created_at', dateThreshold.toISOString());
  }

  // Apply pagination
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error discovering lists:', error);
    throw new Error('Failed to discover lists');
  }

  return data || [];
}

/**
 * Get recent list engagement activity
 */
export async function getListEngagementActivity(
  limit: number = 50
): Promise<ListEngagementActivity[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  // Get recent likes
  const { data: likes } = await supabase
    .from('list_likes')
    .select(`
      *,
      user:users(id, display_name, avatar_url),
      list:custom_lists(id, name, user_id, users!user_id(display_name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit / 2);

  // Get recent clones
  const { data: clones } = await supabase
    .from('list_clones')
    .select(`
      *,
      cloner:users!cloned_by_user_id(id, display_name, avatar_url),
      original_list:custom_lists!original_list_id(id, name, user_id, users!user_id(display_name))
    `)
    .order('created_at', { ascending: false })
    .limit(limit / 2);

  const activities: ListEngagementActivity[] = [];

  // Process likes
  if (likes) {
    likes.forEach((like: any) => {
      activities.push({
        id: `like-${like.id}`,
        type: 'like',
        user_id: like.user.id,
        user_name: like.user.display_name,
        user_avatar: like.user.avatar_url,
        list_id: like.list.id,
        list_name: like.list.name,
        list_creator_id: like.list.user_id,
        list_creator_name: like.list.users.display_name,
        created_at: like.created_at,
      });
    });
  }

  // Process clones
  if (clones) {
    clones.forEach((clone: any) => {
      activities.push({
        id: `clone-${clone.id}`,
        type: 'clone',
        user_id: clone.cloner.id,
        user_name: clone.cloner.display_name,
        user_avatar: clone.cloner.avatar_url,
        list_id: clone.original_list.id,
        list_name: clone.original_list.name,
        list_creator_id: clone.original_list.user_id,
        list_creator_name: clone.original_list.users.display_name,
        created_at: clone.created_at,
        clone_notes: clone.clone_notes,
      });
    });
  }

  // Sort by date and limit
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}