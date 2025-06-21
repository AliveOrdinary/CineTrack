/**
 * Unit tests for useErrorRecovery hook
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorRecovery } from '@/hooks/use-error-recovery';

describe('useErrorRecovery', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorRecovery());
    
    expect(result.current.error).toBeNull();
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it('should capture and store errors', () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.error).toBe(testError);
    expect(result.current.canRetry).toBe(true);
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    expect(result.current.error).toBe(testError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(true);
  });

  it('should handle recovery attempts', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    const mockOperation = jest.fn().mockResolvedValue('success');

    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    await act(async () => {
      const returnValue = await result.current.retry(mockOperation);
      expect(returnValue).toBe('success');
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('should handle recovery failures', async () => {
    const { result } = renderHook(() => useErrorRecovery({ maxRetries: 2 }));
    const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

    act(() => {
      result.current.handleError(new Error('Original error'));
    });

    await act(async () => {
      try {
        await result.current.retry(mockOperation);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.error).toEqual(new Error('Operation failed'));
    expect(result.current.retryCount).toBe(1);
    expect(result.current.canRetry).toBe(true); // Still can retry since maxRetries is 2
  });

  it('should track retry attempts correctly', async () => {
    const { result } = renderHook(() => useErrorRecovery({ maxRetries: 3 }));
    const mockOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));

    act(() => {
      result.current.handleError(new Error('Original error'));
    });

    // First retry
    await act(async () => {
      try {
        await result.current.retry(mockOperation);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.retryCount).toBe(1);
    expect(result.current.canRetry).toBe(true);

    // Second retry
    await act(async () => {
      try {
        await result.current.retry(mockOperation);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.retryCount).toBe(2);
    expect(result.current.canRetry).toBe(true);

    // Third retry (should reach max)
    await act(async () => {
      try {
        await result.current.retry(mockOperation);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.retryCount).toBe(3);
    expect(result.current.canRetry).toBe(false); // Should be false after reaching max retries
  });

  it('should set isRetrying state during recovery', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    let resolveOperation: (value: string) => void;
    const mockOperation = jest.fn(() => new Promise<string>(resolve => {
      resolveOperation = resolve;
    }));

    act(() => {
      result.current.handleError(new Error('Test error'));
    });

    // Start recovery but don't await it yet
    const retryPromise = result.current.retry(mockOperation);

    // Should be retrying
    expect(result.current.isRetrying).toBe(true);

    // Resolve the operation
    resolveOperation!('success');
    
    // Now await the promise
    await act(async () => {
      await retryPromise;
    });

    // Should no longer be retrying
    expect(result.current.isRetrying).toBe(false);
  });

  it('should handle recovery with custom options', async () => {
    const onError = jest.fn();
    const onRetry = jest.fn();
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useErrorRecovery({
      maxRetries: 2,
      onError,
      onRetry,
      onSuccess
    }));

    act(() => {
      result.current.handleError(new Error('Original error'));
    });

    expect(onError).toHaveBeenCalledWith(new Error('Original error'));

    // Test that maxRetries is respected (though the hook doesn't enforce it internally,
    // it's used to determine canRetry)
    const mockOperation = jest.fn().mockResolvedValue('success');

    await act(async () => {
      await result.current.retry(mockOperation);
    });

    expect(onRetry).toHaveBeenCalledWith(1);
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should execute operations with recovery', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    const mockOperation = jest.fn().mockResolvedValue('success');

    const returnValue = await act(async () => {
      return result.current.executeWithRecovery(mockOperation);
    });

    expect(returnValue).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('should handle executeWithRecovery failures', async () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Operation failed');
    const mockOperation = jest.fn().mockRejectedValue(testError);

    const returnValue = await act(async () => {
      return result.current.executeWithRecovery(mockOperation);
    });

    expect(returnValue).toBeNull();
    expect(result.current.error).toEqual(testError);
  });

  it('should provide user-friendly error messages', () => {
    const { result } = renderHook(() => useErrorRecovery());
    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError);
    });

    const friendlyMessage = result.current.getUserFriendlyError();
    expect(friendlyMessage).toBeDefined();
    expect(typeof friendlyMessage).toBe('string');
  });
});