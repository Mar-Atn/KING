/**
 * Structured Logger for AI Character Prototype
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private logLevel: LogLevel = 'info';

  setLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatMessage(level: LogLevel, category: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`;

    let formatted = `${prefix} ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context, null, 2)}`;
    }

    return formatted;
  }

  debug(category: string, message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', category, message, context));
    }
  }

  info(category: string, message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', category, message, context));
    }
  }

  warn(category: string, message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', category, message, context));
    }
  }

  error(category: string, message: string, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', category, message, context));
    }
  }

  // Category-specific helpers
  init(message: string, context?: LogContext) {
    this.info('INIT', message, context);
  }

  conv(message: string, context?: LogContext) {
    this.info('CONV', message, context);
  }

  reflect(message: string, context?: LogContext) {
    this.info('REFLECT', message, context);
  }

  memory(message: string, context?: LogContext) {
    this.info('MEMORY', message, context);
  }

  voice(message: string, context?: LogContext) {
    this.info('VOICE', message, context);
  }

  db(message: string, context?: LogContext) {
    this.debug('DB', message, context);
  }

  success(message: string, context?: LogContext) {
    this.info('SUCCESS', message, context);
  }

  complete(message: string, context?: LogContext) {
    this.info('COMPLETE', message, context);
  }
}

export const logger = new Logger();
