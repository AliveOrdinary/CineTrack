/**
 * Unit tests for TMDB types
 */

import { MediaType, TmdbGenre } from '@/lib/tmdb/types';

describe('TMDB Types', () => {
  describe('MediaType', () => {
    it('should include expected media types', () => {
      // This is a type-only test to ensure types are correctly defined
      const movieType: MediaType = 'movie';
      const tvType: MediaType = 'tv';
      const personType: MediaType = 'person';
      
      expect(movieType).toBe('movie');
      expect(tvType).toBe('tv');
      expect(personType).toBe('person');
    });
  });

  describe('TmdbGenre', () => {
    it('should have correct structure', () => {
      const genre: TmdbGenre = {
        id: 28,
        name: 'Action'
      };
      
      expect(genre.id).toBe(28);
      expect(genre.name).toBe('Action');
      expect(typeof genre.id).toBe('number');
      expect(typeof genre.name).toBe('string');
    });
  });
});