import { NextResponse } from 'next/server';
import { logger } from './error-logger';

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
  timestamp: string;
}

export interface ApiErrorResponse {
  error: ApiError;
  success: false;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  success: true;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Common error types
export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `External service error: ${service}`, 502, 'EXTERNAL_SERVICE_ERROR', {
      service,
    });
    this.name = 'ExternalServiceError';
  }
}

// Error handler for API routes
export function handleApiError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString();

  // Handle known AppError instances
  if (error instanceof AppError) {
    logger.error(`API Error in ${context || 'unknown'}`, error, {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    });

    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
          timestamp,
        },
        success: false,
      },
      { status: error.statusCode }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    logger.error(`Unexpected error in ${context || 'unknown'}`, error);

    // Don't expose internal error details in production
    const message =
      process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        error: {
          message,
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp,
        },
        success: false,
      },
      { status: 500 }
    );
  }

  // Handle unknown error types
  logger.error(`Unknown error type in ${context || 'unknown'}`, new Error(String(error)));

  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
        timestamp,
      },
      success: false,
    },
    { status: 500 }
  );
}

// Success response helper
export function createSuccessResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({
    data,
    success: true,
  });
}

// Client-side error handler
export function handleClientError(error: unknown, context?: string): string {
  logger.error(
    `Client error in ${context || 'unknown'}`,
    error instanceof Error ? error : new Error(String(error))
  );

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

// Async wrapper for API routes
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

// User-friendly error messages
export const ERROR_MESSAGES = {
  // Authentication
  AUTHENTICATION_ERROR: 'Please sign in to continue',
  AUTHORIZATION_ERROR: "You don't have permission to perform this action",

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again',

  // Network
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  TIMEOUT_ERROR: 'Request timed out. Please try again',

  // External services
  TMDB_ERROR: 'Unable to fetch movie data. Please try again later',
  SUPABASE_ERROR: 'Database error. Please try again later',

  // Generic
  INTERNAL_ERROR: 'Something went wrong. Please try again later',
  NOT_FOUND_ERROR: 'The requested resource was not found',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again',

  // Default
  DEFAULT: 'An unexpected error occurred. Please try again',
} as const;

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError && error.code) {
    return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES] || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.DEFAULT;
}

// Retry logic for failed operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        logger.error(
          `Operation failed after ${maxRetries} attempts in ${context || 'unknown'}`,
          lastError
        );
        throw lastError;
      }

      logger.warn(
        `Operation failed, retrying (${attempt}/${maxRetries}) in ${context || 'unknown'}`,
        { attempt },
        lastError
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}
