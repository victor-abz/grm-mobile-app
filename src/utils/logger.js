class Logger {
  constructor() {
    this.isDev = __DEV__;
  }

  info(message, context = {}) {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, context);
    }
  }

  warn(message, context = {}) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  error(message, error = null, context = {}) {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error, context);
    }
  }

  debug(message, context = {}) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  setUser(user) {
    if (this.isDev) {
      console.log(`[USER] Setting user context:`, user.username || user.name);
    }
  }

  setContext(key, value) {
    if (this.isDev) {
      console.log(`[CONTEXT] Setting ${key}:`, value);
    }
  }

  performance(operation, duration, context = {}) {
    if (this.isDev) {
      console.log(`[PERF] ${operation} took ${duration}ms`, context);
    }
  }

  userAction(action, screen, context = {}) {
    if (this.isDev) {
      console.log(`[ACTION] ${action} on ${screen}`, context);
    }
  }

  apiCall(method, endpoint, status, duration, context = {}) {
    if (this.isDev) {
      console.log(`[API] ${method} ${endpoint} - ${status} (${duration}ms)`, context);
    }
  }

  database(operation, table, duration, context = {}) {
    if (this.isDev && duration > 100) {
      console.log(`[DB] ${operation} on ${table} (${duration}ms)`, context);
    }
  }
}

export const logger = new Logger();
export default logger;
