/**
 * Unit tests for utility functions
 */

import { cn } from '@/lib/utils';

describe('lib/utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const result = cn('text-red-500', true && 'bg-blue-500', false && 'hidden');
      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['text-red-500', 'bg-blue-500']);
      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle null and undefined', () => {
      const result = cn('text-red-500', null, undefined, 'bg-blue-500');
      expect(result).toBe('text-red-500 bg-blue-500');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'p-4': true
      });
      expect(result).toBe('text-red-500 p-4');
    });

    it('should merge duplicate classes', () => {
      const result = cn('p-4', 'p-4', 'text-red-500');
      expect(result).toBe('p-4 text-red-500');
    });
  });
});