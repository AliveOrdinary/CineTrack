import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // Error filtering
  beforeSend(event, hint) {
    // Filter out development errors in production
    if (process.env.NODE_ENV === 'production') {
      // Don't send errors from localhost
      if (event.request?.url?.includes('localhost')) {
        return null;
      }

      // Filter out common browser extension errors
      if (event.exception?.values?.[0]?.value?.includes('Non-Error promise rejection captured')) {
        return null;
      }

      // Filter out network errors that are not actionable
      if (event.exception?.values?.[0]?.value?.includes('NetworkError')) {
        return null;
      }
    }

    return event;
  },

  // Additional context
  initialScope: {
    tags: {
      component: 'client',
    },
  },
});
