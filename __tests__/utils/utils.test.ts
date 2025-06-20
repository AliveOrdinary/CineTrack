/**
 * Unit tests for utility functions
 */

import { cn } from '@/lib/utils';

describe('lib/utils', () => {
  describe('cn (className merge)', () => {
    it('should merge class names correctly', () => {
      expect(cn('base', 'extra')).toBe('base extra');
    });

    it('should handle conditional class names', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });

    it('should handle Tailwind conflicts correctly', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle arrays', () => {
      expect(cn(['base', 'extra'])).toBe('base extra');
    });

    it('should handle objects', () => {
      expect(cn({
        'base': true,
        'conditional': true,
        'hidden': false
      })).toBe('base conditional');
    });
  });
});