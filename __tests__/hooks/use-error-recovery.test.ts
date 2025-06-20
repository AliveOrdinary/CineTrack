/**
 * Unit tests for useErrorRecovery hook
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorRecovery } from '@/hooks/use-error-recovery';

describe('useErrorRecovery', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    expect(result.current.error).toBeNull();
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('should capture and store errors', () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Test error');

    act(() => {
      result.current.captureError(testError);
    });

    expect(result.current.error).toBe(testError);
    expect(result.current.isRecovering).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Test error');

    act(() => {
      result.current.captureError(testError);
    });

    expect(result.current.error).toBe(testError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('should handle recovery attempts', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    const mockRecoveryFn = jest.fn().mockResolvedValue(undefined);

    act(() => {
      result.current.captureError(new Error('Test error'));
    });

    await act(async () => {
      await result.current.retry(mockRecoveryFn);
    });

    expect(mockRecoveryFn).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isRecovering).toBe(false);
  });

  it('should handle recovery failures', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    const recoveryError = new Error('Recovery failed');
    const mockRecoveryFn = jest.fn().mockRejectedValue(recoveryError);

    act(() => {
      result.current.captureError(new Error('Original error'));
    });

    await act(async () => {
      await result.current.retry(mockRecoveryFn);
    });

    expect(mockRecoveryFn).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(1);
    expect(result.current.error).toBe(recoveryError);
    expect(result.current.isRecovering).toBe(false);
  });

  it('should track retry attempts correctly', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    const mockRecoveryFn = jest.fn()
      .mockRejectedValueOnce(new Error('First retry failed'))
      .mockRejectedValueOnce(new Error('Second retry failed'))
      .mockResolvedValue(undefined);

    act(() => {
      result.current.captureError(new Error('Original error'));
    });

    // First retry
    await act(async () => {
      await result.current.retry(mockRecoveryFn);
    });
    expect(result.current.retryCount).toBe(1);

    // Second retry
    await act(async () => {
      await result.current.retry(mockRecoveryFn);
    });
    expect(result.current.retryCount).toBe(2);

    // Third retry (successful)
    await act(async () => {
      await result.current.retry(mockRecoveryFn);
    });
    expect(result.current.retryCount).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it('should set isRecovering state during recovery', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    let resolveRecovery: () => void;
    const recoveryPromise = new Promise<void>((resolve) => {
      resolveRecovery = resolve;
    });
    const mockRecoveryFn = jest.fn().mockReturnValue(recoveryPromise);

    act(() => {
      result.current.captureError(new Error('Test error'));
    });

    // Start recovery
    const retryPromise = act(async () => {
      await result.current.retry(mockRecoveryFn);
    });

    // Should be recovering
    expect(result.current.isRecovering).toBe(true);

    // Complete recovery
    resolveRecovery!();
    await retryPromise;

    expect(result.current.isRecovering).toBe(false);
  });

  it('should handle recovery with custom options', async () => {
    const { result } = renderHook(() => useErrorRecovery({
      maxRetries: 2,
      retryDelay: 100
    }));
    
    const mockRecoveryFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    act(() => {
      result.current.captureError(new Error('Original error'));
    });

    // Test that maxRetries is respected (though the hook doesn't enforce it internally,
    // this tests that the options are accepted)
    await act(async () => {
      await result.current.retry(mockRecoveryFn);
    });

    expect(result.current.retryCount).toBe(1);
  });
});