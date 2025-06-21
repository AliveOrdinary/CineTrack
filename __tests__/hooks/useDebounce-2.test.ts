/**
 * Unit tests for second useDebounce hook variant
 */

import { renderHook, act } from '@testing-library/react';
import { useDebounce as useDebounce2 } from '@/hooks/use-debounce';

describe('useDebounce (use-debounce.ts)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce2('test', 500));
    
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce2(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    expect(result.current).toBe('initial');
    
    // Change value
    rerender({ value: 'updated', delay: 500 });
    
    // Should still be initial immediately
    expect(result.current).toBe('initial');
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Should now be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce2(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    // Change value multiple times rapidly
    rerender({ value: 'change1', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    rerender({ value: 'change2', delay: 500 });
    
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    rerender({ value: 'final', delay: 500 });
    
    // Should still be initial after partial time
    expect(result.current).toBe('initial');
    
    // Complete the full delay
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Should be the final value
    expect(result.current).toBe('final');
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce2(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );
    
    rerender({ value: 'updated', delay: 100 });
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(result.current).toBe('updated');
  });

  it('should clean up timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce2(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    rerender({ value: 'updated', delay: 500 });
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });
});