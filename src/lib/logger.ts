// Production-safe logger.
// - Development: console output with [Pawzr] prefix.
// - Production: log/info/warn/debug stay silent (no PII in device logs),
//   but error() is routed to Sentry so production failures are debuggable.
//   error() is therefore the single pipeline for "this should be investigated".

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
    // In production, only errors are kept — forwarded to Sentry.
    // Lazy-require avoids any import-order issue with the Sentry module.
    const reportToSentry = (...args: any[]) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { Sentry } = require('./sentry') as typeof import('./sentry');
        const first = args[0];
        const err =
          first instanceof Error
            ? first
            : new Error(
                ['[Pawzr]', ...args.map(a => (typeof a === 'string' ? a : JSON.stringify(a) ?? '?'))].join(' ')
              );
        Sentry.captureException(err);
      } catch {
        // error reporting must never crash the app
      }
    };
    return {
      log: noop,
      warn: noop,
      error: reportToSentry,
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
