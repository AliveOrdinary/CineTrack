/**
 * Shared types and utilities for CineTrack
 * This file exports common functionality used by both frontend and backend
 */

// Re-export all types
export * from './types';

// Explicitly export Database type to ensure it's available
export type { Database } from './types/supabase';

// Common utilities can be added here 