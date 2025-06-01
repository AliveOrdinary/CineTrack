'use client';

import { useEffect } from 'react';
import { logSecurityStatus } from '@/lib/security-headers';

/**
 * SecurityLogger Component
 * Logs security status in development mode
 */
export function SecurityLogger() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV === 'development') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        logSecurityStatus();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // This component doesn't render anything
  return null;
} 