// Production-safe logger that only outputs in development mode
// This prevents sensitive data from being logged in production builds

const isDev = __DEV__;

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

const createLogger = (): Logger => {
  const noop = () => {};

  if (!isDev) {
    // In production, all logging is disabled
    return {
      log: noop,
      warn: noop,
      error: noop,
      info: noop,
      debug: noop,
    };
  }

  // In development, wrap console methods with optional filtering
  return {
    log: (...args: any[]) => console.log('[Pawzr]', ...args),
    warn: (...args: any[]) => console.warn('[Pawzr]', ...args),
    error: (...args: any[]) => console.error('[Pawzr]', ...args),
    info: (...args: any[]) => console.info('[Pawzr]', ...args),
    debug: (...args: any[]) => console.debug('[Pawzr]', ...args),
  };
};

const logger = createLogger();

export default logger;

// Named exports for convenience
export const { log, warn, error, info, debug } = logger;
