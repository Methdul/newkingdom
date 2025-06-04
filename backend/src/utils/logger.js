/**
 * Logger Utility
 * Centralized logging with different levels and formats
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || 'logs/app.log';
    this.maxSize = process.env.LOG_MAX_SIZE || '10m';
    this.maxFiles = parseInt(process.env.LOG_MAX_FILES) || 5;
    
    // Ensure logs directory exists
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  writeToFile(formattedMessage) {
    if (process.env.NODE_ENV !== 'test') {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output with colors
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        error: '\x1b[31m',   // Red
        warn: '\x1b[33m',    // Yellow
        info: '\x1b[36m',    // Cyan
        debug: '\x1b[90m'    // Gray
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level] || ''}${formattedMessage}${reset}`);
    }

    // File output
    this.writeToFile(formattedMessage);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Specialized logging methods
  auth(action, userId, success, meta = {}) {
    this.info(`AUTH: ${action}`, {
      userId,
      success,
      action,
      ...meta
    });
  }

  security(event, meta = {}) {
    this.warn(`SECURITY: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  api(method, url, statusCode, duration, meta = {}) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `API: ${method} ${url} ${statusCode} (${duration}ms)`, meta);
  }

  payment(action, memberId, amount, success, meta = {}) {
    this.info(`PAYMENT: ${action}`, {
      memberId,
      amount,
      success,
      action,
      ...meta
    });
  }

  // Database logging
  db(query, duration, error = null) {
    if (error) {
      this.error(`DB ERROR: ${query}`, { duration, error: error.message });
    } else {
      this.debug(`DB: ${query} (${duration}ms)`);
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;