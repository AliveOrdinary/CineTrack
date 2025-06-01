import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production') {
      // Filter out common server errors that are not actionable
      if (event.exception?.values?.[0]?.value?.includes('ECONNRESET')) {
        return null
      }
    }
    
    return event
  },
  
  // Additional context
  initialScope: {
    tags: {
      component: 'server',
    },
  },
}) 