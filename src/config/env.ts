import Constants from 'expo-constants';

// Environment configuration
// In production, these should be set via EAS secrets or environment variables
const ENV = {
  // API Configuration
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://pawzrpro.vercel.app/api',

  // Google OAuth (EAS secrets with hardcoded fallbacks for reliability)
  GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '1094158533320-aumh0qgrr06o0o17umlulthgj3m72dlq.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '1094158533320-7fugh8bijpp1770uo21b0ubf8f36odp1.apps.googleusercontent.com',

  // Firebase Configuration (should be set via EAS secrets for production)
  FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',

  // Digio Aadhaar Verification API
  // Note: These are only used if calling Digio directly (not recommended)
  // Preferred: Backend handles Digio calls, these stay empty on client
  DIGIO_CLIENT_ID: process.env.EXPO_PUBLIC_DIGIO_CLIENT_ID || '',
  DIGIO_CLIENT_SECRET: process.env.EXPO_PUBLIC_DIGIO_CLIENT_SECRET || '',
  DIGIO_ENV: process.env.EXPO_PUBLIC_DIGIO_ENV || 'sandbox', // 'sandbox' or 'production'

  // App Configuration
  IS_PRODUCTION: !__DEV__,
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',

  // Demo Account for App Store Review
  DEMO_EMAIL: 'demo@pawzr.app',
  DEMO_PASSWORD: 'PawzrDemo2024!',
};

export default ENV;

// Helper to check if all required env vars are set
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'GOOGLE_WEB_CLIENT_ID',
    'GOOGLE_IOS_CLIENT_ID',
  ];

  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
