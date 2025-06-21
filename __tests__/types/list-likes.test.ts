/**
 * Unit tests for list likes types and utilities
 */

import {
  formatListEngagementDate,
  calculatePopularityScore,
  getEngagementLevel,
  getEngagementLevelColor,
  canLikeList,
  canCloneList,
  getListTypeLabel,
  getListTypeIcon,
  formatEngagementCount,
  generateCloneTitle,
  validateCloneInput
} from '@/types/list-likes';
import type { CustomListWithEngagement, CreateListCloneInput } from '@/types/list-likes';

describe('list-likes types and utilities', () => {
  describe('formatListEngagementDate', () => {
    const fixedDate = new Date('2023-06-01T12:00:00Z');
    
    beforeEach(() => {
      // Mock the Date constructor to return a fixed date
      jest.useFakeTimers();
      jest.setSystemTime(fixedDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format recent dates correctly', () => {
      // Test with times that should trigger "just now"
      const thirtyMinutesAgo = new Date(fixedDate.getTime() - 30 * 60 * 1000).toISOString();
      expect(formatListEngagementDate(thirtyMinutesAgo)).toBe('Just now');
      
      // Test different time periods
      const twoHoursAgo = new Date(fixedDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatListEngagementDate(twoHoursAgo)).toContain('hour');
      
      const oneDayAgo = new Date(fixedDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
      expect(formatListEngagementDate(oneDayAgo)).toContain('day');
    });

    it('should format older dates as calendar dates', () => {
      // Test with a date that's more than a week old
      const oldDate = new Date(fixedDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatListEngagementDate(oldDate);
      // Should contain some date format (could be various formats depending on locale)
      expect(result).toMatch(/\d/); // Should contain at least some digits
      expect(result.length).toBeGreaterThan(5); // Should be more than just "5 days"
    });
  });

  describe('calculatePopularityScore', () => {
    it('should calculate basic popularity score', () => {
      const score = calculatePopularityScore(10, 5, 20, 30);
      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    it('should weight clones higher than likes', () => {
      const scoreWithMoreLikes = calculatePopularityScore(20, 0, 10, 30);
      const scoreWithMoreClones = calculatePopularityScore(0, 10, 10, 30);
      expect(scoreWithMoreClones).toBeGreaterThan(scoreWithMoreLikes);
    });

    it('should apply time decay for older content', () => {
      const newContentScore = calculatePopularityScore(10, 5, 20, 1);
      const oldContentScore = calculatePopularityScore(10, 5, 20, 60);
      expect(newContentScore).toBeGreaterThan(oldContentScore);
    });

    it('should handle zero values', () => {
      const score = calculatePopularityScore(0, 0, 0, 0);
      expect(score).toBe(0);
    });
  });

  describe('getEngagementLevel', () => {
    it('should categorize engagement correctly', () => {
      expect(getEngagementLevel(50, 25, 5)).toBe('viral'); // High daily engagement
      expect(getEngagementLevel(20, 5, 10)).toBe('high'); // Good daily engagement
      expect(getEngagementLevel(5, 2, 10)).toBe('medium'); // Moderate engagement
      expect(getEngagementLevel(1, 0, 10)).toBe('low'); // Low engagement
    });

    it('should handle zero age correctly', () => {
      expect(getEngagementLevel(10, 5, 0)).toBe('viral'); // Prevents division by zero
    });
  });

  describe('getEngagementLevelColor', () => {
    it('should return correct colors for each level', () => {
      expect(getEngagementLevelColor('viral')).toContain('purple');
      expect(getEngagementLevelColor('high')).toContain('green');
      expect(getEngagementLevelColor('medium')).toContain('yellow');
      expect(getEngagementLevelColor('low')).toContain('gray');
      expect(getEngagementLevelColor('unknown')).toContain('gray');
    });
  });

  describe('canLikeList', () => {
    const createMockList = (overrides: Partial<CustomListWithEngagement> = {}): CustomListWithEngagement => ({
      id: 'list-1',
      user_id: 'user-1',
      name: 'Test List',
      visibility: 'public',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      creator_name: 'Test User',
      total_likes: 0,
      total_clones: 0,
      item_count: 0,
      is_liked_by_current_user: false,
      ...overrides
    });

    it('should allow liking public lists by other users', () => {
      const list = createMockList({ user_id: 'other-user', visibility: 'public' });
      expect(canLikeList(list, 'current-user')).toBe(true);
    });

    it('should not allow liking own lists', () => {
      const list = createMockList({ user_id: 'current-user' });
      expect(canLikeList(list, 'current-user')).toBe(false);
    });

    it('should not allow liking already liked lists', () => {
      const list = createMockList({ 
        user_id: 'other-user', 
        is_liked_by_current_user: true 
      });
      expect(canLikeList(list, 'current-user')).toBe(false);
    });

    it('should not allow liking without authentication', () => {
      const list = createMockList();
      expect(canLikeList(list, undefined)).toBe(false);
    });

    it('should allow liking follower-only lists', () => {
      const list = createMockList({ 
        user_id: 'other-user', 
        visibility: 'followers' 
      });
      expect(canLikeList(list, 'current-user')).toBe(true);
    });

    it('should not allow liking private lists', () => {
      const list = createMockList({ 
        user_id: 'other-user', 
        visibility: 'private' 
      });
      expect(canLikeList(list, 'current-user')).toBe(false);
    });
  });

  describe('canCloneList', () => {
    const createMockList = (overrides: Partial<CustomListWithEngagement> = {}): CustomListWithEngagement => ({
      id: 'list-1',
      user_id: 'user-1',
      name: 'Test List',
      visibility: 'public',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      creator_name: 'Test User',
      total_likes: 0,
      total_clones: 0,
      item_count: 0,
      is_liked_by_current_user: false,
      ...overrides
    });

    it('should allow cloning public lists by other users', () => {
      const list = createMockList({ user_id: 'other-user', visibility: 'public' });
      expect(canCloneList(list, 'current-user')).toBe(true);
    });

    it('should not allow cloning own lists', () => {
      const list = createMockList({ user_id: 'current-user' });
      expect(canCloneList(list, 'current-user')).toBe(false);
    });

    it('should not allow cloning without authentication', () => {
      const list = createMockList();
      expect(canCloneList(list, undefined)).toBe(false);
    });

    it('should allow cloning follower-only lists', () => {
      const list = createMockList({ 
        user_id: 'other-user', 
        visibility: 'followers' 
      });
      expect(canCloneList(list, 'current-user')).toBe(true);
    });

    it('should not allow cloning private lists', () => {
      const list = createMockList({ 
        user_id: 'other-user', 
        visibility: 'private' 
      });
      expect(canCloneList(list, 'current-user')).toBe(false);
    });
  });

  describe('getListTypeLabel', () => {
    const createMockList = (overrides: Partial<CustomListWithEngagement> = {}): CustomListWithEngagement => ({
      id: 'list-1',
      user_id: 'user-1',
      name: 'Test List',
      visibility: 'public',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      creator_name: 'Test User',
      total_likes: 0,
      total_clones: 0,
      item_count: 0,
      is_liked_by_current_user: false,
      ...overrides
    });

    it('should return "Original List" for non-cloned lists', () => {
      const list = createMockList();
      expect(getListTypeLabel(list)).toBe('Original List');
    });

    it('should return "Cloned List" for cloned lists with attribution', () => {
      const list = createMockList({ 
        original_list_id: 'original-1',
        is_attribution_visible: true 
      });
      expect(getListTypeLabel(list)).toBe('Cloned List');
    });

    it('should return "Inspired List" for cloned lists without attribution', () => {
      const list = createMockList({ 
        original_list_id: 'original-1',
        is_attribution_visible: false 
      });
      expect(getListTypeLabel(list)).toBe('Inspired List');
    });
  });

  describe('getListTypeIcon', () => {
    const createMockList = (overrides: Partial<CustomListWithEngagement> = {}): CustomListWithEngagement => ({
      id: 'list-1',
      user_id: 'user-1',
      name: 'Test List',
      visibility: 'public',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      creator_name: 'Test User',
      total_likes: 0,
      total_clones: 0,
      item_count: 0,
      is_liked_by_current_user: false,
      ...overrides
    });

    it('should return correct icons for different list types', () => {
      expect(getListTypeIcon(createMockList())).toBe('📝');
      expect(getListTypeIcon(createMockList({ 
        original_list_id: 'original-1',
        is_attribution_visible: true 
      }))).toBe('🔄');
      expect(getListTypeIcon(createMockList({ 
        original_list_id: 'original-1',
        is_attribution_visible: false 
      }))).toBe('💡');
    });
  });

  describe('formatEngagementCount', () => {
    it('should format small numbers as-is', () => {
      expect(formatEngagementCount(0)).toBe('0');
      expect(formatEngagementCount(123)).toBe('123');
      expect(formatEngagementCount(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatEngagementCount(1000)).toBe('1.0K');
      expect(formatEngagementCount(1500)).toBe('1.5K');
      expect(formatEngagementCount(12345)).toBe('12.3K');
      expect(formatEngagementCount(999999)).toBe('1000.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatEngagementCount(1000000)).toBe('1.0M');
      expect(formatEngagementCount(2500000)).toBe('2.5M');
      expect(formatEngagementCount(12345678)).toBe('12.3M');
    });
  });

  describe('generateCloneTitle', () => {
    it('should append clone notes when provided', () => {
      expect(generateCloneTitle('Original Title', 'My Version')).toBe('Original Title - My Version');
    });

    it('should append "(Copy)" when no notes provided', () => {
      expect(generateCloneTitle('Original Title')).toBe('Original Title (Copy)');
      expect(generateCloneTitle('Original Title', '')).toBe('Original Title (Copy)');
      expect(generateCloneTitle('Original Title', '   ')).toBe('Original Title (Copy)');
    });
  });

  describe('validateCloneInput', () => {
    const createValidInput = (overrides: Partial<CreateListCloneInput> = {}): CreateListCloneInput => ({
      original_list_id: 'original-1',
      cloned_list_name: 'My Clone',
      ...overrides
    });

    it('should validate correct input', () => {
      const input = createValidInput();
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty clone name', () => {
      const input = createValidInput({ cloned_list_name: '' });
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Clone name is required');
    });

    it('should reject whitespace-only clone name', () => {
      const input = createValidInput({ cloned_list_name: '   ' });
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Clone name is required');
    });

    it('should reject clone name that is too long', () => {
      const longName = 'a'.repeat(101);
      const input = createValidInput({ cloned_list_name: longName });
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Clone name must be 100 characters or less');
    });

    it('should reject description that is too long', () => {
      const longDescription = 'a'.repeat(501);
      const input = createValidInput({ cloned_list_description: longDescription });
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Clone description must be 500 characters or less');
    });

    it('should reject clone notes that are too long', () => {
      const longNotes = 'a'.repeat(201);
      const input = createValidInput({ clone_notes: longNotes });
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Clone notes must be 200 characters or less');
    });

    it('should handle multiple validation errors', () => {
      const input = createValidInput({
        cloned_list_name: '',
        cloned_list_description: 'a'.repeat(501),
        clone_notes: 'a'.repeat(201)
      });
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('should accept valid optional fields', () => {
      const input = createValidInput({
        cloned_list_description: 'Valid description',
        clone_notes: 'Valid notes',
        is_attribution_visible: false,
        copy_items: true
      });
      const result = validateCloneInput(input);
      expect(result.isValid).toBe(true);
    });
  });
});