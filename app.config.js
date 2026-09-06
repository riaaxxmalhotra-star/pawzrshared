// Dynamic Expo config — replaces the static app.json (Wave 0 audit remediation).
//
// Why this file exists:
// 1. The iOS Google OAuth URL scheme MUST match EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.
//    A static app.json hardcodes one copy of the ID and drifts from env.
// 2. Fail-closed builds: missing/placeholder Google client IDs throw here, so
//    `expo start`, `expo prebuild`, and EAS builds fail loudly instead of
//    shipping a bundle silently bound to the wrong project.
//
// Stable identifiers — DO NOT change without a migration plan:
// bundleIdentifier/package `com.pawzr.app`, EAS projectId, runtimeVersion policy.
//
// CommonJS (module.exports) intentionally: this is the canonical format the
// Expo CLI / EAS build workers evaluate.

const isPlaceholder = (value) =>
  typeof value !== 'string' ||
  value.trim() === '' ||
  /your-|example|placeholder|changeme/i.test(value);

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const missing = [];
if (isPlaceholder(GOOGLE_WEB_CLIENT_ID)) missing.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
if (isPlaceholder(GOOGLE_IOS_CLIENT_ID)) missing.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
if (missing.length > 0) {
  throw new Error(
    '[expo-config] Missing required env vars: ' +
      missing.join(', ') +
      '. Copy .env.example to .env and fill them (EAS secrets in CI).'
  );
}

if (
  isPlaceholder(process.env.EXPO_PUBLIC_FIREBASE_API_KEY) ||
  isPlaceholder(process.env.EXPO_PUBLIC_FIREBASE_APP_ID)
) {
  // eslint-disable-next-line no-console
  console.warn(
    '[expo-config] Firebase env vars are missing — chat will run in degraded mode.'
  );
}

module.exports = {
  name: 'Pawzr',
  slug: 'pawzr',
  owner: 'riaaxxmalhotra',
  version: '1.3.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: false,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFBF5',
  },
  primaryColor: '#FFFBF5',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.pawzr.app',
    buildNumber: '46',
    usesAppleSignIn: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFBF5',
      tabletImage: './assets/splash-icon.png',
    },
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ['com.googleusercontent.apps.' + GOOGLE_IOS_CLIENT_ID],
        },
      ],
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        'Pawzr uses your location to show nearby pet lovers and calculate distances.',
      NSPhotoLibraryUsageDescription:
        'Pawzr needs access to your photo library to let you choose a profile picture for yourself or your pets. For example, you can select a photo of your pet to add to their profile.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFBF5',
    },
    edgeToEdgeEnabled: true,
    package: 'com.pawzr.app',
    versionCode: 71,
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  scheme: 'pawzr',
  extra: {
    eas: {
      projectId: '380a56f3-19c6-4d20-acca-42b5a7e3a349',
    },
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/380a56f3-19c6-4d20-acca-42b5a7e3a349',
  },
  plugins: [
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFBF5',
      },
    ],
    'expo-font',
    'expo-apple-authentication',
    '@react-native-community/datetimepicker',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Pawzr uses your location to show nearby pet lovers and calculate distances.',
      },
    ],
    '@react-native-google-signin/google-signin',
  ],
};
