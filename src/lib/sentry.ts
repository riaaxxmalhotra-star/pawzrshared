import * as Sentry from '@sentry/react-native';
import ENV from '../config/env';

// Initialize Sentry for error monitoring
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.log('Sentry: No DSN configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    // Enable automatic performance monitoring
    tracesSampleRate: ENV.IS_PRODUCTION ? 0.2 : 1.0,
    // Capture user interactions
    enableAutoSessionTracking: true,
    // Don't send errors in development
    enabled: ENV.IS_PRODUCTION,
    // Set environment
    environment: ENV.IS_PRODUCTION ? 'production' : 'development',
    // App version for release tracking
    release: `pawzr@${ENV.APP_VERSION}`,
    dist: ENV.APP_VERSION,
    // Scrub credentials and Aadhaar-like identifiers before upload.
    beforeSend(event) {
      try {
        const scrub = (value: unknown): unknown => {
          if (typeof value === 'string') {
            return value
              .replace(/("?(?:password|passwd|idToken|accessToken|clientSecret|apiKey)"?\s*[:=]\s*"?)[^",}\s]+/gi, '$1[redacted]')
              .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[redacted-12-digit]');
          }
          if (Array.isArray(value)) return value.map(scrub);
          if (value !== null && typeof value === 'object') {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(value)) {
              out[k] = /password|token|secret|apiKey|aadhaar/i.test(k) ? '[redacted]' : scrub(v);
            }
            return out;
          }
          return value;
        };
        if (event.request?.headers) {
          const headers = event.request.headers as Record<string, unknown>;
          if (headers.Authorization) headers.Authorization = '[redacted]';
        }
        if (event.extra) event.extra = scrub(event.extra) as Record<string, unknown>;
        if (event.contexts) event.contexts = scrub(event.contexts) as typeof event.contexts;
      } catch {
        // scrubbing must never drop the event
      }
      return event;
    },
    // Ignore common non-actionable errors (cancellations only — real network
    // failures are actionable and must be reported).
    ignoreErrors: [
      'cancelled',
      'SIGN_IN_CANCELLED',
      'ERR_CANCELED',
    ],
  });
}

// Utility to capture errors with context
export function captureError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

// Set user context for error tracking
export function setUserContext(user: { id: string; email: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null);
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'app',
    data,
    level: 'info',
  });
}

export { Sentry };
