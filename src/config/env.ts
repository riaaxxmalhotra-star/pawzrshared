import Constants from 'expo-constants';

// Environment configuration
// In production, these should be set via EAS secrets or environment variables
const ENV = {
  // API Configuration
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://pawzrpro.vercel.app/api',

  // Google OAuth — REQUIRED, no hardcoded fallbacks.
  // OAuth client IDs are public identifiers, but pinning them here silently
  // binds the bundle to the wrong Google project when env is misconfigured.
  // Missing values fail closed via validateEnv() + app.config.js.
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',

  // Firebase Configuration — OPTIONAL (EAS secrets). Empty = chat degrades
  // to an honest "unavailable" state instead of crashing. Never add project
  // fallbacks here: they defeat isFirebaseConfigured detection.
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',

  // NOTE: Digio/Aadhaar credentials must NEVER be EXPO_PUBLIC_*.
  // The backend owns Digio secrets (plain DIGIO_CLIENT_ID / DIGIO_CLIENT_SECRET
  // server-side env, see lib/digio.ts). The client only calls app/api/aadhaar/*.

  // App Configuration
  IS_PRODUCTION: !__DEV__,
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',

  // Demo Account identifier for App Store review.
  // Email only (shown in UI, not a secret). The password must NEVER ship in
  // the bundle — reviewer credentials live in ASC private notes, and Wave 1
  // replaces this local-only login with a server-issued demo session.
  DEMO_EMAIL: process.env.EXPO_PUBLIC_DEMO_EMAIL || '',
};

export default ENV;

// Fail-closed check for required env vars. Called at startup (App.tsx) and
// mirrored at config time (app.config.js) so misconfigured builds fail loudly
// instead of silently binding to the wrong backend/project.
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'GOOGLE_WEB_CLIENT_ID',
    'GOOGLE_IOS_CLIENT_ID',
  ];

  // Treat .env.example placeholders as missing.
  const isPlaceholder = (value: unknown) =>
    typeof value !== 'string' ||
    value.trim() === '' ||
    /your-|example|placeholder|changeme/i.test(value);

  const missing = required.filter(key => isPlaceholder(ENV[key as keyof typeof ENV]));

  return {
    valid: missing.length === 0,
    missing,
  };
}
