/**
 * Unit tests for continue watching types and utilities
 */

import {
  formatDaysSinceLastEpisode,
  formatWatchingStreak,
  calculateTimeToFinishSeason,
  getNextEpisodeLabel,
  shouldShowContinueWatching,
  categorizeContinueWatchingItems,
  generateWatchingRecommendations,
  getWatchingPatternConfig,
  getUrgencyLevelConfig,
  getRecommendationStrengthConfig,
  WATCHING_PATTERN_CONFIG,
  URGENCY_LEVEL_CONFIG,
  RECOMMENDATION_STRENGTH_CONFIG
} from '@/types/continue-watching';
import type { ContinueWatchingItem } from '@/types/continue-watching';

describe('continue-watching types and utilities', () => {
  describe('formatDaysSinceLastEpisode', () => {
    it('should format days correctly', () => {
      expect(formatDaysSinceLastEpisode(0)).toBe('Today');
      expect(formatDaysSinceLastEpisode(0.5)).toBe('Today');
      expect(formatDaysSinceLastEpisode(1)).toBe('Yesterday');
      expect(formatDaysSinceLastEpisode(1.5)).toBe('Yesterday');
      expect(formatDaysSinceLastEpisode(3)).toBe('3 days ago');
      expect(formatDaysSinceLastEpisode(7)).toBe('1 weeks ago');
      expect(formatDaysSinceLastEpisode(14)).toBe('2 weeks ago');
      expect(formatDaysSinceLastEpisode(30)).toBe('1 months ago');
      expect(formatDaysSinceLastEpisode(60)).toBe('2 months ago');
      expect(formatDaysSinceLastEpisode(365)).toBe('1 years ago');
      expect(formatDaysSinceLastEpisode(730)).toBe('2 years ago');
    });
  });

  describe('formatWatchingStreak', () => {
    it('should format streaks correctly', () => {
      expect(formatWatchingStreak(0)).toBe('No streak');
      expect(formatWatchingStreak(1)).toBe('1 day streak');
      expect(formatWatchingStreak(3)).toBe('3 day streak');
      expect(formatWatchingStreak(7)).toBe('1 week streak');
      expect(formatWatchingStreak(14)).toBe('2 week streak');
      expect(formatWatchingStreak(30)).toBe('1 month streak');
      expect(formatWatchingStreak(60)).toBe('2 month streak');
    });
  });

  describe('calculateTimeToFinishSeason', () => {
    it('should calculate time correctly', () => {
      expect(calculateTimeToFinishSeason(1)).toBe('45m');
      expect(calculateTimeToFinishSeason(2)).toBe('1h 30m');
      expect(calculateTimeToFinishSeason(4)).toBe('3h');
      expect(calculateTimeToFinishSeason(0)).toBe('0m');
    });

    it('should handle custom episode lengths', () => {
      expect(calculateTimeToFinishSeason(2, 30)).toBe('1h');
      expect(calculateTimeToFinishSeason(3, 60)).toBe('3h');
      expect(calculateTimeToFinishSeason(1, 90)).toBe('1h 30m');
    });
  });

  describe('getNextEpisodeLabel', () => {
    it('should format episode labels correctly', () => {
      expect(getNextEpisodeLabel(1, 1)).toBe('S01E01');
      expect(getNextEpisodeLabel(2, 10)).toBe('S02E10');
      expect(getNextEpisodeLabel(10, 5)).toBe('S10E05');
    });
  });

  describe('shouldShowContinueWatching', () => {
    const createMockItem = (overrides: Partial<ContinueWatchingItem> = {}): ContinueWatchingItem => ({
      tmdb_tv_id: 1,
      total_episodes_watched: 5,
      last_watched_date: '2023-01-01',
      next_season_number: 1,
      next_episode_number: 6,
      is_hidden: false,
      is_completed: false,
      watching_pattern: 'regular_watching',
      days_since_last_episode: 7,
      watching_streak: 3,
      final_priority_score: 100,
      ...overrides
    });

    it('should show items that are not hidden or completed', () => {
      const item = createMockItem();
      expect(shouldShowContinueWatching(item)).toBe(true);
    });

    it('should hide items that are marked as hidden', () => {
      const item = createMockItem({ is_hidden: true });
      expect(shouldShowContinueWatching(item)).toBe(false);
    });

    it('should hide items that are completed', () => {
      const item = createMockItem({ is_completed: true });
      expect(shouldShowContinueWatching(item)).toBe(false);
    });

    it('should hide items not watched in 90+ days', () => {
      const item = createMockItem({ days_since_last_episode: 91 });
      expect(shouldShowContinueWatching(item)).toBe(false);
    });

    it('should show items watched within 90 days', () => {
      const item = createMockItem({ days_since_last_episode: 89 });
      expect(shouldShowContinueWatching(item)).toBe(true);
    });
  });

  describe('categorizeContinueWatchingItems', () => {
    const createMockItem = (overrides: Partial<ContinueWatchingItem> = {}): ContinueWatchingItem => ({
      tmdb_tv_id: 1,
      total_episodes_watched: 5,
      last_watched_date: '2023-01-01',
      next_season_number: 1,
      next_episode_number: 6,
      is_hidden: false,
      is_completed: false,
      watching_pattern: 'regular_watching',
      days_since_last_episode: 7,
      watching_streak: 3,
      final_priority_score: 100,
      ...overrides
    });

    it('should categorize items correctly', () => {
      const items = [
        createMockItem({ 
          urgency_level: 'fresh', 
          recommendation_strength: 'high',
          tmdb_tv_id: 1 
        }),
        createMockItem({ 
          watching_pattern: 'binge_watching',
          tmdb_tv_id: 2 
        }),
        createMockItem({ 
          total_episodes_watched: 3, 
          days_since_last_episode: 5,
          tmdb_tv_id: 3 
        }),
        createMockItem({ 
          urgency_level: 'old',
          tmdb_tv_id: 4 
        }),
        createMockItem({ 
          urgency_level: 'stale',
          tmdb_tv_id: 5 
        })
      ];

      const categorized = categorizeContinueWatchingItems(items);

      // Should have at least some categories
      expect(categorized.length).toBeGreaterThan(0);
      
      // Check that items are distributed across categories
      const totalItemsInCategories = categorized.reduce((sum, cat) => sum + cat.count, 0);
      expect(totalItemsInCategories).toBe(items.length);

      // Check specific categories exist
      const upNext = categorized.find(c => c.category === 'up_next');
      const bingeWorthy = categorized.find(c => c.category === 'binge_worthy');
      const recentlyStarted = categorized.find(c => c.category === 'recently_started');

      expect(upNext).toBeDefined();
      expect(bingeWorthy).toBeDefined();
      expect(recentlyStarted).toBeDefined();
    });

    it('should filter out empty categories', () => {
      const items = [
        createMockItem({ 
          urgency_level: 'fresh', 
          recommendation_strength: 'high' 
        })
      ];

      const categorized = categorizeContinueWatchingItems(items);

      expect(categorized).toHaveLength(1);
      expect(categorized[0].category).toBe('up_next');
    });
  });

  describe('generateWatchingRecommendations', () => {
    const createMockItem = (overrides: Partial<ContinueWatchingItem> = {}): ContinueWatchingItem => ({
      tmdb_tv_id: 1,
      total_episodes_watched: 5,
      last_watched_date: '2023-01-01',
      next_season_number: 1,
      next_episode_number: 6,
      is_hidden: false,
      is_completed: false,
      watching_pattern: 'regular_watching',
      days_since_last_episode: 7,
      watching_streak: 3,
      final_priority_score: 100,
      ...overrides
    });

    it('should generate recommendations for binge watching', () => {
      const items = [
        createMockItem({ 
          watching_pattern: 'binge_watching',
          tmdb_tv_id: 1 
        })
      ];

      const recommendations = generateWatchingRecommendations(items);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].recommendation_type).toBe('continue_binge');
      expect(recommendations[0].urgency_score).toBe(9);
    });

    it('should generate catch up recommendations', () => {
      const items = [
        createMockItem({ 
          days_since_last_episode: 20,
          tmdb_tv_id: 1 
        })
      ];

      const recommendations = generateWatchingRecommendations(items);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].recommendation_type).toBe('catch_up');
      expect(recommendations[0].urgency_score).toBe(7);
    });

    it('should generate finishing touch recommendations', () => {
      const items = [
        createMockItem({ 
          total_episodes_watched: 25,
          days_since_last_episode: 5,
          tmdb_tv_id: 1 
        })
      ];

      const recommendations = generateWatchingRecommendations(items);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].recommendation_type).toBe('finishing_touch');
      expect(recommendations[0].urgency_score).toBe(8);
    });

    it('should limit to top 3 recommendations', () => {
      const items = Array.from({ length: 5 }, (_, i) => 
        createMockItem({ tmdb_tv_id: i + 1 })
      );

      const recommendations = generateWatchingRecommendations(items);

      expect(recommendations).toHaveLength(3);
    });
  });

  describe('configuration getters', () => {
    it('should return correct watching pattern config', () => {
      expect(getWatchingPatternConfig('binge_watching')).toBe(WATCHING_PATTERN_CONFIG.binge_watching);
      expect(getWatchingPatternConfig('regular_watching')).toBe(WATCHING_PATTERN_CONFIG.regular_watching);
      expect(getWatchingPatternConfig('casual_watching')).toBe(WATCHING_PATTERN_CONFIG.casual_watching);
      expect(getWatchingPatternConfig('inactive')).toBe(WATCHING_PATTERN_CONFIG.inactive);
    });

    it('should return correct urgency level config', () => {
      expect(getUrgencyLevelConfig('fresh')).toBe(URGENCY_LEVEL_CONFIG.fresh);
      expect(getUrgencyLevelConfig('recent')).toBe(URGENCY_LEVEL_CONFIG.recent);
      expect(getUrgencyLevelConfig('old')).toBe(URGENCY_LEVEL_CONFIG.old);
      expect(getUrgencyLevelConfig('stale')).toBe(URGENCY_LEVEL_CONFIG.stale);
    });

    it('should return correct recommendation strength config', () => {
      expect(getRecommendationStrengthConfig('high')).toBe(RECOMMENDATION_STRENGTH_CONFIG.high);
      expect(getRecommendationStrengthConfig('medium')).toBe(RECOMMENDATION_STRENGTH_CONFIG.medium);
      expect(getRecommendationStrengthConfig('low')).toBe(RECOMMENDATION_STRENGTH_CONFIG.low);
    });
  });

  describe('configuration objects', () => {
    it('should have complete watching pattern configurations', () => {
      Object.values(WATCHING_PATTERN_CONFIG).forEach(config => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('color');
        expect(typeof config.label).toBe('string');
        expect(typeof config.icon).toBe('string');
        expect(typeof config.description).toBe('string');
        expect(typeof config.color).toBe('string');
      });
    });

    it('should have complete urgency level configurations', () => {
      Object.values(URGENCY_LEVEL_CONFIG).forEach(config => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('color');
      });
    });

    it('should have complete recommendation strength configurations', () => {
      Object.values(RECOMMENDATION_STRENGTH_CONFIG).forEach(config => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('color');
      });
    });
  });
});