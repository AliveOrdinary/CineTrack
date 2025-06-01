'use client'

import { ErrorBoundary } from './error-boundary'
import { logErrorBoundary } from '@/lib/error-logger'
import { ReactNode } from 'react'

interface ErrorBoundaryWrapperProps {
  children: ReactNode
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary onError={logErrorBoundary}>
      {children}
    </ErrorBoundary>
  )
} 