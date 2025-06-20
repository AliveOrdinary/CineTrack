/**
 * Rate Limiting Utilities
 * Implements rate limiting for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  /** Number of requests allowed per window */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Optional custom identifier function */
  identifier?: (request: NextRequest) => string;
  /** Optional custom error message */
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  identifier: string;
}

// In-memory store for development - in production, use Redis or similar
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest, customIdentifier?: (req: NextRequest) => string): string {
  if (customIdentifier) {
    return customIdentifier(request);
  }

  // Try to get user ID from auth header or session
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    return `user:${authHeader}`;
  }

  // Fallback to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const identifier = getClientIdentifier(request, config.identifier);
  const now = Date.now();
  const windowMs = config.window * 1000;
  const key = `${identifier}:${Math.floor(now / windowMs)}`;

  const current = requestCounts.get(key);
  const resetTime = Math.ceil(now / windowMs) * windowMs;

  if (!current) {
    // First request in this window
    requestCounts.set(key, { count: 1, resetTime });
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime,
      identifier,
    };
  }

  if (current.count >= config.limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime,
      identifier,
    };
  }

  // Increment count
  current.count++;
  requestCounts.set(key, current);

  return {
    success: true,
    remaining: config.limit - current.count,
    resetTime,
    identifier,
  };
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  config: RateLimitConfig
): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: config.message || 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    { status: 429 }
  );

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', config.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  response.headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());

  return response;
}

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(config: RateLimitConfig) {
  return function rateLimit(handler: (request: NextRequest) => Promise<NextResponse> | NextResponse) {
    return async function (request: NextRequest): Promise<NextResponse> {
      const result = checkRateLimit(request, config);

      if (!result.success) {
        return createRateLimitResponse(result, config);
      }

      // Add rate limit headers to successful responses
      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', config.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

      return response;
    };
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    limit: 5,
    window: 60, // 5 requests per minute
    message: 'Too many authentication attempts. Please wait before trying again.',
  },
  
  // Moderate limits for API endpoints
  api: {
    limit: 100,
    window: 60, // 100 requests per minute
    message: 'API rate limit exceeded. Please slow down your requests.',
  },
  
  // Generous limits for content browsing
  content: {
    limit: 1000,
    window: 60, // 1000 requests per minute
    message: 'Content rate limit exceeded. Please slow down your requests.',
  },
  
  // Very strict limits for reporting/moderation
  moderation: {
    limit: 10,
    window: 300, // 10 requests per 5 minutes
    message: 'Moderation action rate limit exceeded. Please wait before performing more actions.',
  },
} as const;

/**
 * Clean up expired entries (should be called periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const expiredKeys: string[] = [];

  requestCounts.forEach((data, key) => {
    if (now > data.resetTime) {
      expiredKeys.push(key);
    }
  });

  expiredKeys.forEach(key => requestCounts.delete(key));
  
  return expiredKeys.length;
}

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}