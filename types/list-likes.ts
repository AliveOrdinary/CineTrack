/**
 * TypeScript types for the List Likes and Cloning System
 */

// Base list like interface from database
export interface ListLike {
  id: string;
  user_id: string;
  list_id: string;
  created_at: string;
}

// List like with user information
export interface ListLikeWithUser extends ListLike {
  user: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

// Base list clone interface from database
export interface ListClone {
  id: string;
  original_list_id: string;
  cloned_list_id: string;
  cloned_by_user_id: string;
  clone_notes?: string;
  is_attribution_visible: boolean;
  created_at: string;
}

// List clone with full relationship information
export interface ListCloneRelationship {
  id: string;
  original_list_id: string;
  cloned_list_id: string;
  cloned_by_user_id: string;
  clone_notes?: string;
  is_attribution_visible: boolean;
  created_at: string;
  original_list_name: string;
  original_list_description?: string;
  original_creator_id: string;
  original_creator_name: string;
  original_creator_avatar?: string;
  cloned_list_name: string;
  cloned_list_description?: string;
  cloned_creator_id: string;
  cloned_creator_name: string;
  cloned_creator_avatar?: string;
}

// Input types for creating likes and clones
export interface CreateListLikeInput {
  list_id: string;
}

export interface CreateListCloneInput {
  original_list_id: string;
  cloned_list_name: string;
  cloned_list_description?: string;
  clone_notes?: string;
  is_attribution_visible?: boolean;
  copy_items?: boolean; // Whether to copy all items from original list
}

// Extended custom list with engagement metrics
export interface CustomListWithEngagement {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  visibility: 'public' | 'followers' | 'private';
  banner_image_url?: string;
  created_at: string;
  updated_at: string;
  creator_name: string;
  creator_avatar?: string;
  total_likes: number;
  total_clones: number;
  item_count: number;
  is_liked_by_current_user: boolean;
  original_list_id?: string;
  is_attribution_visible?: boolean;
  original_creator_name?: string;
  original_creator_avatar?: string;
}

// List engagement statistics
export interface ListEngagementStats {
  total_likes: number;
  total_clones: number;
  recent_likes: number; // Last 30 days
  recent_clones: number; // Last 30 days
  top_likers: Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    liked_at: string;
  }>;
  clone_creators: Array<{
    user_id: string;
    display_name: string;
    avatar_url?: string;
    cloned_at: string;
    clone_notes?: string;
  }>;
}

// Popular list with popularity score
export interface PopularList extends CustomListWithEngagement {
  popularity_score: number;
  age_in_days: number;
}

// User's liked list with like information
export interface UserLikedList extends ListLike {
  list: CustomListWithEngagement;
}

// List interaction summary for a user
export interface UserListInteractions {
  liked_lists: UserLikedList[];
  cloned_lists: ListCloneRelationship[];
  lists_cloned_by_others: ListCloneRelationship[];
  total_likes_received: number;
  total_clones_received: number;
  total_likes_given: number;
  total_clones_made: number;
}

// Filter and sorting options for lists
export interface ListEngagementFilters {
  visibility?: ('public' | 'followers' | 'private')[];
  has_likes?: boolean;
  has_clones?: boolean;
  min_likes?: number;
  min_clones?: number;
  created_after?: string;
  created_before?: string;
}

export interface ListEngagementSortOptions {
  field: 'created_at' | 'updated_at' | 'likes_count' | 'clones_count' | 'popularity_score' | 'name';
  direction: 'asc' | 'desc';
}

// Pagination options
export interface ListEngagementPaginationOptions {
  limit: number;
  offset: number;
}

// Combined query options
export interface ListEngagementQueryOptions {
  filters?: ListEngagementFilters;
  sort?: ListEngagementSortOptions;
  pagination?: ListEngagementPaginationOptions;
}

// Clone operation result
export interface CloneListResult {
  cloned_list: CustomListWithEngagement;
  clone_relationship: ListClone;
  copied_items_count: number;
}

// List discovery categories
export type ListDiscoveryCategory = 
  | 'trending'
  | 'most_liked'
  | 'most_cloned'
  | 'recently_created'
  | 'recently_updated'
  | 'by_followers'
  | 'similar_to_liked';

// List discovery options
export interface ListDiscoveryOptions {
  category: ListDiscoveryCategory;
  time_period?: '24h' | '7d' | '30d' | 'all';
  limit?: number;
  offset?: number;
  exclude_own_lists?: boolean;
}

// List engagement activity item
export interface ListEngagementActivity {
  id: string;
  type: 'like' | 'clone';
  user_id: string;
  user_name: string;
  user_avatar?: string;
  list_id: string;
  list_name: string;
  list_creator_id: string;
  list_creator_name: string;
  created_at: string;
  clone_notes?: string; // Only for clone activities
}

// Utility functions
export function formatListEngagementDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${Math.floor(diffInDays)} day${Math.floor(diffInDays) !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function calculatePopularityScore(
  likes: number,
  clones: number,
  items: number,
  ageInDays: number
): number {
  // Base score from engagement
  const baseScore = likes * 2 + clones * 5 + items * 0.1;
  
  // Apply time decay (newer content gets slight boost)
  const timeDecay = Math.exp(-ageInDays / 30); // Decay over 30 days
  const timeBoost = 1 + (timeDecay * 0.2); // Max 20% boost for new content
  
  return Math.round(baseScore * timeBoost * 100) / 100;
}

export function getEngagementLevel(
  likes: number,
  clones: number,
  ageInDays: number
): 'low' | 'medium' | 'high' | 'viral' {
  const totalEngagement = likes + clones * 2;
  const dailyEngagement = totalEngagement / Math.max(ageInDays, 1);
  
  if (dailyEngagement >= 10) return 'viral';
  if (dailyEngagement >= 2) return 'high';
  if (dailyEngagement >= 0.5) return 'medium';
  return 'low';
}

export function getEngagementLevelColor(level: string): string {
  switch (level) {
    case 'viral':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'high':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function canLikeList(
  list: CustomListWithEngagement,
  currentUserId?: string
): boolean {
  if (!currentUserId) return false;
  if (list.user_id === currentUserId) return false; // Can't like own lists
  if (list.is_liked_by_current_user) return false; // Already liked
  
  // Can like public lists or follower-only lists if following
  return list.visibility === 'public' || list.visibility === 'followers';
}

export function canCloneList(
  list: CustomListWithEngagement,
  currentUserId?: string
): boolean {
  if (!currentUserId) return false;
  if (list.user_id === currentUserId) return false; // Can't clone own lists
  
  // Can clone public lists or follower-only lists if following
  return list.visibility === 'public' || list.visibility === 'followers';
}

export function getListTypeLabel(list: CustomListWithEngagement): string {
  if (list.original_list_id) {
    return list.is_attribution_visible ? 'Cloned List' : 'Inspired List';
  }
  return 'Original List';
}

export function getListTypeIcon(list: CustomListWithEngagement): string {
  if (list.original_list_id) {
    return list.is_attribution_visible ? '🔄' : '💡';
  }
  return '📝';
}

export function formatEngagementCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
}

export function generateCloneTitle(originalTitle: string, cloneNotes?: string): string {
  if (cloneNotes && cloneNotes.trim()) {
    return `${originalTitle} - ${cloneNotes.trim()}`;
  }
  return `${originalTitle} (Copy)`;
}

export function validateCloneInput(input: CreateListCloneInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!input.cloned_list_name.trim()) {
    errors.push('Clone name is required');
  } else if (input.cloned_list_name.length > 100) {
    errors.push('Clone name must be 100 characters or less');
  }
  
  if (input.cloned_list_description && input.cloned_list_description.length > 500) {
    errors.push('Clone description must be 500 characters or less');
  }
  
  if (input.clone_notes && input.clone_notes.length > 200) {
    errors.push('Clone notes must be 200 characters or less');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}