import AsyncStorage from '@react-native-async-storage/async-storage';

// Session-token storage. Prefers expo-secure-store (keychain/keystore);
// falls back to AsyncStorage on platforms without it (e.g. web) so auth
// keeps working everywhere. A token found in the legacy AsyncStorage slot
// is migrated forward on first read, then wiped from the insecure slot.

const LEGACY_TOKEN_KEY = 'token';
const SECURE_TOKEN_KEY = 'pawzr_session_token';

let SecureStore: typeof import('expo-secure-store') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SecureStore = require('expo-secure-store');
} catch {
  SecureStore = null;
}

async function secureGet(): Promise<string | null> {
  if (!SecureStore) return null;
  try {
    return await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  const secure = await secureGet();
  if (secure) return secure;

  // Legacy slot: migrate forward when SecureStore is available, else use as-is.
  try {
    const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy && SecureStore) {
      try {
        await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacy);
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
      } catch {
        // Migration best-effort; legacy slot remains the source of truth.
      }
    }
    return legacy;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  if (SecureStore) {
    try {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
      return;
    } catch {
      // fall through to AsyncStorage
    }
  }
  await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  if (SecureStore) {
    try {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    } catch {
      // best-effort
    }
  }
  try {
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // best-effort
  }
}
