/**
 * Unit tests for ErrorLogger
 */

import { logger, logError, logApiError, logPerformance } from '@/lib/error-logger';

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Mock environment
const originalEnv = process.env.NODE_ENV;
const originalWindow = global.window;

describe('ErrorLogger', () => {
  beforeEach(() => {
    // Reset mocks
    Object.assign(console, mockConsole);
    Object.keys(mockConsole).forEach(key => mockConsole[key as keyof typeof mockConsole].mockClear());
    
    // Reset environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore console
    Object.assign(console, originalConsole);
    
    // Restore environment
    process.env.NODE_ENV = originalEnv;
  });

  afterAll(() => {
    // Restore window
    global.window = originalWindow;
  });

  describe('Basic Logging', () => {
    it('logs debug messages', () => {
      logger.debug('Debug message');
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug message'),
        undefined
      );
    });

    it('logs info messages', () => {
      logger.info('Info message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Info message'),
        undefined
      );
    });

    it('logs warning messages', () => {
      logger.warn('Warning message');
      
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message'),
        undefined
      );
    });

    it('logs error messages', () => {
      logger.error('Error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message'),
        undefined
      );
    });

    it('logs fatal messages', () => {
      logger.fatal('Fatal message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[FATAL] Fatal message'),
        undefined
      );
    });
  });

  describe('Context Logging', () => {
    it('includes context in log messages', () => {
      const context = { userId: '123', action: 'test' };
      logger.info('Test message', context);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Context: {"userId":"123","action":"test"')
      );
    });

    it('merges provided context with auto-generated context', () => {
      const context = { userId: '123' };
      logger.info('Test message', context);
      
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain('userId":"123"');
      expect(loggedMessage).toContain('timestamp');
    });
  });

  describe('Error Object Logging', () => {
    it('logs Error objects with stack traces', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { error });
      
      const loggedMessage = mockConsole.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Test error');
      expect(loggedMessage).toContain('stack');
    });

    it('handles errors without stack traces', () => {
      const error = { message: 'Custom error', name: 'CustomError' };
      logger.error('Custom error occurred', { error });
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Custom error occurred')
      );
    });
  });

  describe('Environment-specific Behavior', () => {
    it('behaves differently in development vs production', () => {
      // Test development mode
      process.env.NODE_ENV = 'development';
      const devLogger = new ErrorLogger();
      devLogger.debug('Dev debug');
      
      expect(mockConsole.debug).toHaveBeenCalled();
      
      // Reset mock
      mockConsole.debug.mockClear();
      
      // Test production mode
      process.env.NODE_ENV = 'production';
      const prodLogger = new ErrorLogger();
      prodLogger.debug('Prod debug');
      
      // In production, debug messages might be suppressed
      // This depends on your implementation
    });
  });

  describe('Client vs Server Context', () => {
    it('includes browser-specific context when in client environment', () => {
      // Mock window object
      Object.defineProperty(global, 'window', {
        value: {
          location: { href: 'https://example.com/test' },
          navigator: { userAgent: 'Test Browser' }
        },
        writable: true
      });
      
      // Mock localStorage for session ID
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'test-session-123'),
          setItem: jest.fn(),
        },
        writable: true
      });
      
      const clientLogger = new ErrorLogger();
      clientLogger.info('Client message');
      
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toContain('userAgent');
      expect(loggedMessage).toContain('url');
    });

    it('handles server environment without browser globals', () => {
      // Ensure window is undefined
      delete (global as any).window;
      
      const serverLogger = new ErrorLogger();
      serverLogger.info('Server message');
      
      expect(mockConsole.info).toHaveBeenCalled();
      // Should not throw errors even without browser globals
    });
  });

  describe('Message Formatting', () => {
    it('formats messages with timestamps', () => {
      logger.info('Test message');
      
      const loggedMessage = mockConsole.info.mock.calls[0][0];
      expect(loggedMessage).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('includes log level in formatted messages', () => {
      logger.warn('Warning message');
      
      const loggedMessage = mockConsole.warn.mock.calls[0][0];
      expect(loggedMessage).toContain('[WARN]');
    });

    it('handles complex context objects', () => {
      const complexContext = {
        nested: { object: { with: 'values' } },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined
      };
      
      logger.info('Complex context', complexContext);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('nested')
      );
    });
  });

  describe('Error Scenarios', () => {
    it('handles logging when console methods are unavailable', () => {
      // Temporarily remove console.info
      const originalInfo = console.info;
      delete (console as any).info;
      
      // Should not throw
      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
      
      // Restore console.info
      console.info = originalInfo;
    });

    it('handles circular references in context', () => {
      const circularContext: any = { name: 'test' };
      circularContext.self = circularContext;
      
      // Should not throw on circular reference
      expect(() => {
        logger.info('Circular context', circularContext);
      }).not.toThrow();
    });
  });
});