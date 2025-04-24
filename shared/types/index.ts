/**
 * Type definitions shared between frontend and backend
 */

import { Database } from './supabase';

// Media types
export type MediaType = 'movie' | 'tv' | 'person';

// Watchlist types
export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  priority?: number;
  added_date: string;
  notes?: string;
}

// User types
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  region?: string;
  preferences?: Record<string, any>;
  role?: string;
  created_at: string;
  updated_at?: string;
}

// Export Database types from Supabase
export type { Database } from './supabase';

// Try to import generated Supabase types if they exist
try {
  // This will be populated by the 'gen:types' script
  // export * from './supabase';
} catch (e) {
  // Supabase types don't exist yet
} 