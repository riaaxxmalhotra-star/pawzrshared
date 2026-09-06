import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Alert } from 'react-native';
import { authApi, profileApi, setUnauthorizedHandler } from './api';
import { setAuthToken, clearAuthToken } from './tokenStore';
import { setUserContext, clearUserContext, addBreadcrumb } from './sentry';
import logger from './logger';
import ENV from '../config/env';

// Try to import native Google Sign-In, fallback gracefully if not available
let GoogleSignin: any = null;
let statusCodes: any = {};
try {
  const googleSignIn = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignIn.GoogleSignin;
  statusCodes = googleSignIn.statusCodes;
} catch (e) {
  logger.log('Native Google Sign-In not available, using fallback');
}

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  birthday?: string;
  gender: string;
  vaccinated: boolean;
  photos: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  pincode?: string;
  city?: string;
  state?: string;
  bio?: string;
  dob?: string;
  photos?: string[];
  location?: { lat: number; lng: number };
  onboardingComplete?: boolean;
  aadhaarVerified?: boolean;
  pets?: Pet[];
  // Pet lover preferences
  preferredPets?: string[];
  services?: string[];
  availability?: string[];
  experience?: string;
  // Prompts (Bumble-style)
  prompts?: { promptId: string; prompt: string; answer: string }[];
  practicalAnswers?: { [key: string]: string };
  // Supplier fields
  businessName?: string;
  gstNumber?: string;
  googleMapsLink?: string;
  categories?: string[];
  deliveryAvailable?: boolean;
  deliveryRadius?: string;
  minOrder?: string;
  products?: any[];
  orders?: any[];
  inventory?: any[];
  // Cafe/Events fields
  ownerName?: string;
  petAmenities?: string[];
  workingDays?: string[];
  openTime?: string;
  closeTime?: string;
  seatingCapacity?: number;
  priceRange?: string;
  cafePhotos?: string[];
}

interface AuthContextType {
  user: User | null;
  /** Busy with an interactive sign-in/out request (button spinners). */
  isLoading: boolean;
  /** True only during the startup session restore (full-screen loader). */
  isRestoring: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  isAppleAuthAvailable: boolean;
  signOut: () => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  signInWithDemoAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// OAuth credentials come from env config only — no second-layer fallbacks
// (a stale hardcoded ID here would silently override a correct env value).
const GOOGLE_WEB_CLIENT_ID = ENV.GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = ENV.GOOGLE_IOS_CLIENT_ID;

// Configure Google Sign-In if available
if (GoogleSignin) {
  try {
    GoogleSignin.configure({
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });
  } catch (e) {
    logger.log('Failed to configure Google Sign-In:', e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
  // Mirror of the session for async callbacks (401 handler) that would
  // otherwise capture a stale first-render closure.
  const userRef = useRef<User | null>(null);

  // Check Apple Auth availability on iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
    }
  }, []);

  // Restore the session on mount. No forced timeouts: the restore either
  // resolves or fails fast, and the UI gates on isRestoring — never on the
  // interactive isLoading flag, so sign-in spinners can't unmount navigation.
  useEffect(() => {
    checkStoredUser();
    // A 401 sent with a rejected token means the session is dead.
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Profile storage keys are lowercased: `User@X.com` and `user@x.com` are the
  // same account. Reads fall back to the legacy exact-case key once.
  function profileKey(email: string): string {
    return `userProfile_${email.trim().toLowerCase()}`;
  }

  async function lookupSavedProfile(email: string): Promise<User | null> {
    for (const key of [`userProfile_${email}`, profileKey(email)]) {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) return JSON.parse(raw) as User;
      } catch {
        // try the next key variant
      }
    }
    return null;
  }

  // Single write path for every session change: state + ref + Sentry context
  // + both storage slots. All profile/role/onboarding updates funnel here.
  async function persistSession(finalUser: User) {
    userRef.current = finalUser;
    setUser(finalUser);
    setUserContext({ id: finalUser.id, email: finalUser.email, role: finalUser.role });
    await AsyncStorage.setItem('user', JSON.stringify(finalUser));
    await AsyncStorage.setItem(profileKey(finalUser.email), JSON.stringify(finalUser));
  }

  async function checkStoredUser() {
    try {
      logger.log('Checking stored user...');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as User;
          userRef.current = parsed;
          setUser(parsed);
          setUserContext({ id: parsed.id, email: parsed.email, role: parsed.role });
        } catch (parseError) {
          logger.error('Error parsing stored user');
          // Clear corrupted data
          await AsyncStorage.removeItem('user').catch(() => {});
        }
      }
    } catch (error) {
      logger.error('Error checking stored user');
      // Clear corrupted storage
      await AsyncStorage.removeItem('user').catch(() => {});
    } finally {
      setIsRestoring(false);
    }
  }

  async function signInWithGoogle() {
    try {
      setIsLoading(true);
      logger.log('Starting Google sign in...');

      // Check if native Google Sign-In is available
      if (!GoogleSignin) {
        Alert.alert(
          'Development Mode',
          'Google Sign-In requires a production build. Please use "Try Demo" button instead.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // hasPlayServices throws on iOS — only check on Android.
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Sign in with Google
      const signInResult = await GoogleSignin.signIn();
      logger.log('Google sign in result received');

      const googleUser = signInResult.data?.user;
      if (!googleUser?.email) {
        throw new Error('Failed to get user email from Google');
      }

      // Try to sync with backend API
      let apiUser = null;
      try {
        const idToken = signInResult.data?.idToken;
        if (idToken) {
          const result = await authApi.googleToken(idToken, '');
          logger.log('API response received');
          if (result.user) {
            apiUser = result.user;
            if (result.token) {
              await setAuthToken(result.token);
            }
          }
        }
      } catch (apiError: any) {
        logger.log('Backend API unavailable, using local auth');
      }

      // Determine final user — the saved profile is the source of truth.
      // Fresh auth data only fills gaps; it never overwrites saved data.
      const userEmail = (apiUser?.email || googleUser.email).trim().toLowerCase();
      const savedProfile = await lookupSavedProfile(userEmail);
      const googleName =
        typeof googleUser.name === 'string' && googleUser.name.trim() !== ''
          ? googleUser.name
          : undefined;
      const googlePhoto =
        typeof googleUser.photo === 'string' && googleUser.photo !== ''
          ? googleUser.photo
          : undefined;

      let finalUser: User;
      if (savedProfile) {
        logger.log('Restoring saved profile');
        finalUser = {
          ...savedProfile,
          email: userEmail,
          id: apiUser?.id || savedProfile.id,
          name: savedProfile.name || apiUser?.name || googleName || '',
          image: savedProfile.image || apiUser?.image || googlePhoto,
        };
      } else if (apiUser) {
        finalUser = { ...apiUser, email: userEmail };
      } else {
        // Create new user from Google
        finalUser = {
          id: googleUser.id,
          email: userEmail,
          name: googleName || '',
          role: 'OWNER',
          image: googlePhoto,
          onboardingComplete: false,
        };
      }

      logger.log('User authenticated successfully');
      addBreadcrumb('auth: google sign-in', 'auth', { backendLinked: !!apiUser });
      await persistSession(finalUser);
    } catch (error: any) {
      logger.error('Google sign in error:', error.message || error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        logger.log('User cancelled sign in');
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        logger.log('Sign in already in progress');
        return;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
        return;
      }

      Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithApple() {
    try {
      setIsLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      logger.log('Apple auth credential received');

      // Apple returns email/fullName ONLY on first login. Persist the stable
      // Apple user ID -> email mapping so later logins resolve the same account
      // instead of orphaning into a fresh `apple_<id>@privaterelay` profile.
      const appleUserId: string = credential.user;
      if (credential.email) {
        try {
          await AsyncStorage.setItem(`appleId_${appleUserId}`, credential.email);
        } catch {
          // best-effort mapping write
        }
      }
      let mappedEmail: string | null = credential.email ?? null;
      if (!mappedEmail) {
        try {
          mappedEmail = await AsyncStorage.getItem(`appleId_${appleUserId}`);
        } catch {
          mappedEmail = null;
        }
      }
      const normalizedEmail = mappedEmail
        ? mappedEmail.trim().toLowerCase()
        : `apple_${appleUserId}@privaterelay.appleid.com`;

      // Only treat the name as real when Apple actually provided one —
      // never overwrite a saved name with the 'Apple User' placeholder.
      const given = credential.fullName?.givenName ?? '';
      const family = credential.fullName?.familyName ?? '';
      const realAppleName = `${given} ${family}`.trim() || undefined;

      const savedProfile = await lookupSavedProfile(normalizedEmail);

      let finalUser: User;

      if (savedProfile) {
        // Found saved profile - restore it
        logger.log('Restoring saved Apple profile');
        finalUser = {
          ...savedProfile,
          email: normalizedEmail,
          id: appleUserId,
          name: realAppleName || savedProfile.name,
        };
      } else {
        // New user from Apple
        finalUser = {
          id: appleUserId,
          email: normalizedEmail,
          name: realAppleName || 'Apple User',
          role: 'OWNER',
          onboardingComplete: false,
        };
      }

      // Backend session (best-effort — local session when backend is unreachable).
      if (credential.identityToken) {
        try {
          const result = await authApi.appleToken(credential.identityToken, { user: appleUserId });
          if (result?.token) {
            await setAuthToken(result.token);
          }
          if (result?.user) {
            finalUser = { ...finalUser, ...result.user, email: normalizedEmail };
          }
        } catch {
          logger.log('Backend Apple session unavailable, using local auth');
        }
      }

      logger.log('Apple user authenticated successfully');
      addBreadcrumb('auth: apple sign-in', 'auth', { returning: !!savedProfile });
      await persistSession(finalUser);

    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        logger.log('Apple Sign In was cancelled');
      } else {
        logger.error('Apple sign in error');
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      // Save user profile by email before clearing session (so it can be restored on re-login)
      const current = userRef.current ?? user;
      if (current?.email) {
        await AsyncStorage.setItem(profileKey(current.email), JSON.stringify(current));
      }
      // Sign out from Google if available
      if (GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch (e) {
          // Ignore Google sign out errors
        }
      }
      await clearAuthToken();
      await AsyncStorage.removeItem('user');
      clearUserContext();
      addBreadcrumb('auth: sign-out', 'auth');
      userRef.current = null;
      setUser(null);
    } catch (error) {
      logger.error('Sign out error');
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(role: string) {
    const current = userRef.current ?? user;
    if (current) {
      await persistSession({ ...current, role });
    }
  }

  async function completeOnboarding() {
    const current = userRef.current ?? user;
    if (current) {
      await persistSession({ ...current, onboardingComplete: true });
    }
  }

  async function updateUserProfile(updates: Partial<User>) {
    const current = userRef.current ?? user;
    if (current) {
      await persistSession({ ...current, ...updates });
    }
  }

  async function deleteAccount() {
    try {
      setIsLoading(true);

      // Try to delete from backend
      try {
        await profileApi.deleteAccount();
      } catch (apiError) {
        logger.log('Backend delete failed or unavailable, continuing local cleanup');
      }

      // Clear all local data
      const email = userRef.current?.email ?? user?.email;
      if (email) {
        await AsyncStorage.removeItem(profileKey(email));
        // Legacy exact-case key cleanup (pre-normalization installs)
        await AsyncStorage.removeItem(`userProfile_${email}`);
      }
      await AsyncStorage.removeItem('user');
      await clearAuthToken();
      clearUserContext();

      // Sign out from Google if available
      if (GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch (e) {
          // Ignore
        }
      }

      userRef.current = null;
      setUser(null);
    } catch (error) {
      logger.error('Delete account error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Demo account for App Store review
  // Local-only until Wave 1 replaces it with a server-issued demo session.
  // Fail closed when unconfigured instead of creating a broken profile.
  async function signInWithDemoAccount() {
    if (!ENV.DEMO_EMAIL) {
      throw new Error(
        'Demo account is not configured. Set EXPO_PUBLIC_DEMO_EMAIL to enable it.'
      );
    }
    try {
      setIsLoading(true);

      const demoUser: User = {
        id: 'demo_reviewer_account',
        email: ENV.DEMO_EMAIL,
        name: 'Demo User',
        role: 'OWNER',
        onboardingComplete: true,
        image: 'https://ui-avatars.com/api/?name=Demo+User&background=FF6B6B&color=fff',
        phone: '+91 98765 43210',
        city: 'Mumbai',
        state: 'Maharashtra',
        bio: 'Demo account for App Store review. This is a sample pet owner profile.',
        pets: [
          {
            id: 'demo_pet_1',
            name: 'Buddy',
            species: 'Dog',
            breed: 'Golden Retriever',
            age: '3 years',
            gender: 'Male',
            vaccinated: true,
            photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=400'],
          },
          {
            id: 'demo_pet_2',
            name: 'Whiskers',
            species: 'Cat',
            breed: 'Persian',
            age: '2 years',
            gender: 'Female',
            vaccinated: true,
            photos: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400'],
          },
        ],
      };

      addBreadcrumb('auth: demo sign-in', 'auth');
      await persistSession(demoUser);
      logger.log('Demo account signed in');
    } catch (error) {
      logger.error('Demo sign in error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isRestoring,
        signInWithGoogle,
        signInWithApple,
        isAppleAuthAvailable,
        signOut,
        updateUserRole,
        completeOnboarding,
        updateUserProfile,
        signInWithDemoAccount,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
