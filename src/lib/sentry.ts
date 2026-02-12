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
    // Ignore common non-actionable errors
    ignoreErrors: [
      'Network request failed',
      'cancelled',
      'SIGN_IN_CANCELLED',
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
