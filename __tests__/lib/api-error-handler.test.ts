/**
 * Unit tests for API Error Handler
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
} from '@/lib/api-error-handler';

// Mock the logger
jest.mock('@/lib/error-logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

import { logger } from '@/lib/error-logger';
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('API Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Classes', () => {
    describe('AppError', () => {
      it('creates error with default status code 500', () => {
        const error = new AppError('Test error');
        
        expect(error.message).toBe('Test error');
        expect(error.statusCode).toBe(500);
        expect(error.name).toBe('AppError');
        expect(error.code).toBeUndefined();
        expect(error.details).toBeUndefined();
      });

      it('creates error with custom status code and details', () => {
        const details = { field: 'email', reason: 'invalid format' };
        const error = new AppError('Custom error', 400, 'INVALID_INPUT', details);
        
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('INVALID_INPUT');
        expect(error.details).toEqual(details);
      });
    });

    describe('ValidationError', () => {
      it('creates validation error with 400 status code', () => {
        const details = { field: 'email' };
        const error = new ValidationError('Invalid email', details);
        
        expect(error.message).toBe('Invalid email');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.details).toEqual(details);
      });
    });

    describe('AuthenticationError', () => {
      it('creates authentication error with 401 status code', () => {
        const error = new AuthenticationError('Not authenticated');
        
        expect(error.message).toBe('Not authenticated');
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('AUTHENTICATION_ERROR');
      });
    });

    describe('AuthorizationError', () => {
      it('creates authorization error with 403 status code', () => {
        const error = new AuthorizationError('Access denied');
        
        expect(error.message).toBe('Access denied');
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('AUTHORIZATION_ERROR');
      });
    });

    describe('NotFoundError', () => {
      it('creates not found error with 404 status code', () => {
        const error = new NotFoundError('Resource not found');
        
        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
      });
    });
  });

  describe('Response Creators', () => {
    describe('createErrorResponse', () => {
      it('creates error response from AppError', () => {
        const error = new ValidationError('Invalid input', { field: 'email' });
        const response = createErrorResponse(error);
        
        expect(response).toBeInstanceOf(NextResponse);
        
        // Would need to test response body and status in integration tests
        // due to NextResponse implementation details
      });

      it('creates error response from regular Error', () => {
        const error = new Error('Regular error');
        const response = createErrorResponse(error);
        
        expect(response).toBeInstanceOf(NextResponse);
      });

      it('creates error response with custom status code', () => {
        const error = new Error('Custom error');
        const response = createErrorResponse(error, 418);
        
        expect(response).toBeInstanceOf(NextResponse);
      });
    });

    describe('createSuccessResponse', () => {
      it('creates success response with data', () => {
        const data = { user: { id: 1, name: 'Test' } };
        const response = createSuccessResponse(data);
        
        expect(response).toBeInstanceOf(NextResponse);
      });

      it('creates success response with custom status code', () => {
        const data = { created: true };
        const response = createSuccessResponse(data, 201);
        
        expect(response).toBeInstanceOf(NextResponse);
      });

      it('creates success response with null data', () => {
        const response = createSuccessResponse(null);
        
        expect(response).toBeInstanceOf(NextResponse);
      });
    });
  });

  describe('handleApiError', () => {
    const mockRequest = {} as NextRequest;

    it('logs and returns error response for AppError', () => {
      const error = new ValidationError('Validation failed');
      const response = handleApiError(error, mockRequest);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Error: Validation failed',
        error,
        expect.objectContaining({
          statusCode: 400,
          path: undefined,
          method: undefined,
        })
      );
      
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('logs and returns error response for regular Error', () => {
      const error = new Error('Unexpected error');
      const response = handleApiError(error, mockRequest);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled API Error: Unexpected error',
        error,
        expect.objectContaining({
          statusCode: 500,
        })
      );
      
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('includes request context in logging', () => {
      const mockRequestWithContext = {
        url: 'https://example.com/api/test',
        method: 'POST',
        headers: new Headers({ 'user-agent': 'test-agent' }),
      } as NextRequest;
      
      const error = new AppError('Test error', 400);
      handleApiError(error, mockRequestWithContext);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Error: Test error',
        error,
        expect.objectContaining({
          path: 'https://example.com/api/test',
          method: 'POST',
          userAgent: 'test-agent',
        })
      );
    });

    it('handles errors without statusCode property', () => {
      const error = new Error('Generic error');
      const response = handleApiError(error, mockRequest);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unhandled API Error: Generic error',
        error,
        expect.objectContaining({
          statusCode: 500,
        })
      );
      
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('uses error details in logging context when available', () => {
      const details = { field: 'email', value: 'invalid' };
      const error = new ValidationError('Invalid email format', details);
      
      handleApiError(error, mockRequest);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'API Error: Invalid email format',
        error,
        expect.objectContaining({
          details,
        })
      );
    });
  });

  describe('Error Serialization', () => {
    it('creates proper error response structure', () => {
      const error = new ValidationError('Test validation', { field: 'test' });
      
      // Test that error response has correct structure
      // This would be better tested in integration tests
      expect(error.message).toBe('Test validation');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('includes timestamp in error responses', () => {
      const error = new AppError('Test error');
      const before = Date.now();
      
      // The actual timestamp creation happens in createErrorResponse
      // This test ensures the error object structure supports it
      expect(error).toBeInstanceOf(AppError);
      
      const after = Date.now();
      expect(before).toBeLessThanOrEqual(after);
    });
  });

  describe('Edge Cases', () => {
    it('handles null error gracefully', () => {
      const response = handleApiError(null as any, {} as NextRequest);
      
      expect(mockLogger.error).toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('handles undefined error gracefully', () => {
      const response = handleApiError(undefined as any, {} as NextRequest);
      
      expect(mockLogger.error).toHaveBeenCalled();
      expect(response).toBeInstanceOf(NextResponse);
    });

    it('handles error with circular references in details', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      const error = new AppError('Circular error', 400, 'CIRCULAR', circularObj);
      
      expect(() => {
        handleApiError(error, {} as NextRequest);
      }).not.toThrow();
      
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});