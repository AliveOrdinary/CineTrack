export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  code?: string | number;
  statusCode?: number;
  context?: LogContext;
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context) {
      return `${prefix} ${message} | Context: ${JSON.stringify(context)}`;
    }

    return `${prefix} ${message}`;
  }

  private getContext(): LogContext {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
    };

    if (this.isClient) {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
      context.sessionId = this.getSessionId();
    }

    return context;
  }

  private getSessionId(): string {
    if (!this.isClient) return 'server';

    let sessionId = sessionStorage.getItem('cinetrack_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('cinetrack_session_id', sessionId);
    }
    return sessionId;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;

    // In production, only log warnings and above
    const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = logLevels.indexOf(level);
    const minLevelIndex = logLevels.indexOf('warn');

    return currentLevelIndex >= minLevelIndex;
  }

  private logToConsole(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, error);
        break;
      case 'info':
        console.info(formattedMessage, error);
        break;
      case 'warn':
        console.warn(formattedMessage, error);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage, error);
        break;
    }
  }

  private async logToExternal(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ) {
    // This will be enhanced when we configure Sentry
    if (level === 'error' || level === 'fatal') {
      // For now, just log to console in production
      if (!this.isDevelopment) {
        console.error('External logging:', { level, message, context, error });
      }
    }
  }

  debug(message: string, context?: LogContext) {
    const fullContext = { ...this.getContext(), ...context };
    this.logToConsole('debug', message, fullContext);
  }

  info(message: string, context?: LogContext) {
    const fullContext = { ...this.getContext(), ...context };
    this.logToConsole('info', message, fullContext);
    this.logToExternal('info', message, fullContext);
  }

  warn(message: string, context?: LogContext, error?: Error) {
    const fullContext = { ...this.getContext(), ...context };
    this.logToConsole('warn', message, fullContext, error);
    this.logToExternal('warn', message, fullContext, error);
  }

  error(message: string, error?: Error, context?: LogContext) {
    const fullContext = {
      ...this.getContext(),
      ...context,
      errorStack: error?.stack,
      errorName: error?.name,
    };

    this.logToConsole('error', message, fullContext, error);
    this.logToExternal('error', message, fullContext, error);
  }

  fatal(message: string, error?: Error, context?: LogContext) {
    const fullContext = {
      ...this.getContext(),
      ...context,
      errorStack: error?.stack,
      errorName: error?.name,
    };

    this.logToConsole('fatal', message, fullContext, error);
    this.logToExternal('fatal', message, fullContext, error);
  }

  // Specific error types
  apiError(endpoint: string, statusCode: number, message: string, context?: LogContext) {
    this.error(`API Error: ${endpoint} (${statusCode})`, new Error(message), {
      ...context,
      endpoint,
      statusCode,
      type: 'api_error',
    });
  }

  authError(message: string, context?: LogContext) {
    this.error(`Auth Error: ${message}`, new Error(message), {
      ...context,
      type: 'auth_error',
    });
  }

  databaseError(operation: string, message: string, context?: LogContext) {
    this.error(`Database Error: ${operation}`, new Error(message), {
      ...context,
      operation,
      type: 'database_error',
    });
  }

  validationError(field: string, message: string, context?: LogContext) {
    this.warn(`Validation Error: ${field}`, {
      ...context,
      field,
      type: 'validation_error',
    });
  }

  performanceWarning(operation: string, duration: number, context?: LogContext) {
    this.warn(`Performance Warning: ${operation} took ${duration}ms`, {
      ...context,
      operation,
      duration,
      type: 'performance_warning',
    });
  }
}

// Export singleton instance
export const logger = new ErrorLogger();

// Utility functions for common error scenarios
export const logError = (error: Error, context?: LogContext) => {
  logger.error(error.message, error, context);
};

export const logApiError = (endpoint: string, response: Response, context?: LogContext) => {
  logger.apiError(endpoint, response.status, response.statusText, context);
};

export const logPerformance = (operation: string, startTime: number, context?: LogContext) => {
  const duration = Date.now() - startTime;
  if (duration > 1000) {
    // Log if operation takes more than 1 second
    logger.performanceWarning(operation, duration, context);
  }
};

// Error boundary integration
export const logErrorBoundary = (error: Error, errorInfo: any, context?: LogContext) => {
  logger.fatal('React Error Boundary triggered', error, {
    ...context,
    componentStack: errorInfo.componentStack,
    type: 'react_error_boundary',
  });
};
