import * as Sentry from '@sentry/react-native';

/**
 * Centralized logging utility for GRM Mobile App
 * Provides consistent logging with Sentry integration
 *
 * Usage:
 * - logger.info('User logged in', { userId: '123' })
 * - logger.error('API call failed', error, { endpoint: '/api/issues' })
 * - logger.warn('Deprecated feature used', { feature: 'oldAPI' })
 * - logger.debug('Debug info', { data: someData })
 */

class Logger {
  constructor() {
    this.isDev = __DEV__;
  }

  /**
   * Log info messages - for important business logic flow
   */
  info(message, context = {}) {
    if (this.isDev) {
      console.log(`📱 [INFO] ${message}`, context);
    }

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
      category: 'app.info',
    });
  }

  /**
   * Log warnings - for recoverable issues or deprecated usage
   */
  warn(message, context = {}) {
    if (this.isDev) {
      console.warn(`⚠️ [WARN] ${message}`, context);
    }

    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
      category: 'app.warning',
    });
  }

  /**
   * Log errors - for exceptions and critical issues
   */
  error(message, error = null, context = {}) {
    if (this.isDev) {
      console.error(`❌ [ERROR] ${message}`, error, context);
    }

    // Add context to Sentry scope
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setTag(key, context[key]);
      });

      if (error instanceof Error) {
        scope.setLevel('error');
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    });
  }

  /**
   * Log debug info - only in development
   */
  debug(message, context = {}) {
    if (this.isDev) {
      console.log(`🔍 [DEBUG] ${message}`, context);
    }
  }

  /**
   * Set user context for all subsequent logs
   */
  setUser(user) {
    if (this.isDev) {
      console.log(`👤 [USER] Setting user context:`, user.username || user.name);
    }

    Sentry.setUser({
      id: user.id || user.name,
      email: user.email,
      username: user.username || user.name,
    });
  }

  /**
   * Set additional context tags
   */
  setContext(key, value) {
    if (this.isDev) {
      console.log(`🏷️ [CONTEXT] Setting ${key}:`, value);
    }

    Sentry.setTag(key, value);
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, context = {}) {
    const message = `Performance: ${operation} took ${duration}ms`;

    if (this.isDev) {
      console.log(`⏱️ [PERF] ${message}`, context);
    }

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: { duration, ...context },
      category: 'app.performance',
    });
  }

  /**
   * Log user actions for analytics
   */
  userAction(action, screen, context = {}) {
    const message = `User Action: ${action} on ${screen}`;

    if (this.isDev) {
      console.log(`👤 [ACTION] ${message}`, context);
    }

    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: { action, screen, ...context },
      category: 'user.action',
    });
  }

  /**
   * Log API calls
   */
  apiCall(method, endpoint, status, duration, context = {}) {
    const message = `API ${method} ${endpoint} - ${status}`;

    if (this.isDev) {
      console.log(`🌐 [API] ${message} (${duration}ms)`, context);
    }

    Sentry.addBreadcrumb({
      message,
      level: status >= 400 ? 'error' : 'info',
      data: { method, endpoint, status, duration, ...context },
      category: 'http.request',
    });
  }

  /**
   * Log database operations
   */
  database(operation, table, duration, context = {}) {
    const message = `DB ${operation} on ${table}`;

    if (this.isDev && duration > 100) {
      console.log(`💾 [DB] ${message} (${duration}ms)`, context);
    }

    // Only log slow database operations to avoid spam
    if (duration > 500) {
      Sentry.addBreadcrumb({
        message: `${message} - SLOW (${duration}ms)`,
        level: 'warning',
        data: { operation, table, duration, ...context },
        category: 'db.query',
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
