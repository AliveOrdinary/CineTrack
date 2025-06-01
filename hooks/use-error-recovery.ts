'use client'

import { useState, useCallback } from 'react'
import { logger } from '@/lib/error-logger'
import { getUserFriendlyMessage } from '@/lib/api-error-handler'

interface UseErrorRecoveryOptions {
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error) => void
  onRetry?: (attempt: number) => void
  onSuccess?: () => void
}

interface ErrorRecoveryState {
  error: Error | null
  isRetrying: boolean
  retryCount: number
  canRetry: boolean
}

export function useErrorRecovery(options: UseErrorRecoveryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onRetry,
    onSuccess,
  } = options

  const [state, setState] = useState<ErrorRecoveryState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
  })

  const clearError = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
    })
  }, [])

  const handleError = useCallback((error: Error) => {
    logger.error('Error handled by useErrorRecovery', error)
    
    setState(prev => ({
      ...prev,
      error,
      canRetry: prev.retryCount < maxRetries,
    }))

    onError?.(error)
  }, [maxRetries, onError])

  const retry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!state.canRetry || state.isRetrying) {
      return null
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }))

    onRetry?.(state.retryCount + 1)

    try {
      // Add delay before retry
      if (state.retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * state.retryCount))
      }

      const result = await operation()
      
      // Success - clear error state
      setState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
      })

      onSuccess?.()
      return result
    } catch (error) {
      const newRetryCount = state.retryCount + 1
      const canRetryAgain = newRetryCount < maxRetries

      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        isRetrying: false,
        retryCount: newRetryCount,
        canRetry: canRetryAgain,
      }))

      if (!canRetryAgain) {
        logger.error(`Operation failed after ${maxRetries} retries`, error instanceof Error ? error : new Error(String(error)))
      }

      throw error
    }
  }, [state.canRetry, state.isRetrying, state.retryCount, maxRetries, retryDelay, onRetry, onSuccess])

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      clearError()
      return await operation()
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }, [clearError, handleError])

  const getUserFriendlyError = useCallback(() => {
    if (!state.error) return null
    return getUserFriendlyMessage(state.error)
  }, [state.error])

  return {
    ...state,
    clearError,
    handleError,
    retry,
    executeWithRecovery,
    getUserFriendlyError,
  }
} 