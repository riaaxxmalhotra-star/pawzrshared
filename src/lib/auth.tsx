import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Alert } from 'react-native';
import { authApi } from './api';
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
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  isAppleAuthAvailable: boolean;
  signOut: () => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  signInWithDemoAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use environment configuration for OAuth credentials
const GOOGLE_WEB_CLIENT_ID = ENV.GOOGLE_WEB_CLIENT_ID || '1094158533320-aumh0qgrr06o0o17umlulthgj3m72dlq.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = ENV.GOOGLE_IOS_CLIENT_ID || '1094158533320-7fugh8bijpp1770uo21b0ubf8f36odp1.apps.googleusercontent.com';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Check Apple Auth availability on iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
    }
  }, []);

  // Check for stored user on mount with timeout fallback
  useEffect(() => {
    // Safety timeout - never stay loading forever (reduced to 2 seconds for faster startup)
    const timeout = setTimeout(() => {
      if (isLoading) {
        logger.log('Auth timeout - forcing loading complete');
        setIsLoading(false);
      }
    }, 2000);

    // Start checking stored user immediately
    checkStoredUser();

    return () => clearTimeout(timeout);
  }, []);

  async function checkStoredUser() {
    try {
      logger.log('Checking stored user...');

      // Add timeout to AsyncStorage read (1 second max for fast startup)
      const storagePromise = AsyncStorage.getItem('user');
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 1000)
      );

      const storedUser = await Promise.race([storagePromise, timeoutPromise]);

      logger.log('Stored user found:', !!storedUser);
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          logger.log('User loaded:', parsed?.email);
          setUser(parsed);
        } catch (parseError) {
          logger.error('Error parsing stored user');
          // Clear corrupted data
          AsyncStorage.removeItem('user').catch(() => {});
        }
      }
    } catch (error) {
      logger.error('Error checking stored user');
      // Clear corrupted storage
      AsyncStorage.removeItem('user').catch(() => {});
    } finally {
      logger.log('Setting isLoading to false');
      setIsLoading(false);
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

      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

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
            await AsyncStorage.setItem('token', result.token || '');
          }
        }
      } catch (apiError: any) {
        logger.log('Backend API unavailable, using local auth');
      }

      // Determine final user - always check persistent storage first
      let finalUser: User;
      const userEmail = apiUser?.email || googleUser.email;

      // ALWAYS check persistent profile storage first (survives logout/login)
      const savedProfileData = await AsyncStorage.getItem(`userProfile_${userEmail}`);

      if (savedProfileData) {
        // Found saved profile - this user has logged in before
        const savedProfile = JSON.parse(savedProfileData);
        logger.log('Restoring saved profile');

        // Merge: saved profile is base, update with fresh auth data (but preserve onboarding fields)
        finalUser = {
          ...savedProfile,
          id: apiUser?.id || googleUser.id || savedProfile.id,
          name: apiUser?.name || googleUser.name || savedProfile.name,
          image: apiUser?.image || googleUser.photo || savedProfile.image,
          role: savedProfile.role,
          onboardingComplete: savedProfile.onboardingComplete,
          phone: savedProfile.phone,
          address: savedProfile.address,
          addressLine1: savedProfile.addressLine1,
          addressLine2: savedProfile.addressLine2,
          landmark: savedProfile.landmark,
          pincode: savedProfile.pincode,
          city: savedProfile.city,
          state: savedProfile.state,
          bio: savedProfile.bio,
          dob: savedProfile.dob,
          photos: savedProfile.photos,
          location: savedProfile.location,
          aadhaarVerified: savedProfile.aadhaarVerified,
          pets: savedProfile.pets,
          preferredPets: savedProfile.preferredPets,
          services: savedProfile.services,
          availability: savedProfile.availability,
          experience: savedProfile.experience,
          businessName: savedProfile.businessName,
          gstNumber: savedProfile.gstNumber,
          googleMapsLink: savedProfile.googleMapsLink,
          categories: savedProfile.categories,
          deliveryAvailable: savedProfile.deliveryAvailable,
          deliveryRadius: savedProfile.deliveryRadius,
          minOrder: savedProfile.minOrder,
        };
      } else if (apiUser) {
        finalUser = apiUser;
      } else {
        // Create new user from Google
        finalUser = {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name || '',
          role: 'OWNER',
          image: googleUser.photo || undefined,
          onboardingComplete: false,
        };
      }

      logger.log('User authenticated successfully');
      setUser(finalUser);
      await AsyncStorage.setItem('user', JSON.stringify(finalUser));
      await AsyncStorage.setItem(`userProfile_${finalUser.email}`, JSON.stringify(finalUser));
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

      // Get user info from credential
      const appleEmail = credential.email || `apple_${credential.user}@privaterelay.appleid.com`;
      const appleName = credential.fullName
        ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
        : 'Apple User';

      // Check for saved profile by email first
      const savedProfileData = await AsyncStorage.getItem(`userProfile_${appleEmail}`);

      let finalUser: User;

      if (savedProfileData) {
        // Found saved profile - restore it
        const savedProfile = JSON.parse(savedProfileData);
        logger.log('Restoring saved Apple profile');
        finalUser = {
          ...savedProfile,
          id: credential.user,
          name: appleName || savedProfile.name,
          // Preserve all onboarding data
          role: savedProfile.role,
          onboardingComplete: savedProfile.onboardingComplete,
          phone: savedProfile.phone,
          addressLine1: savedProfile.addressLine1,
          addressLine2: savedProfile.addressLine2,
          landmark: savedProfile.landmark,
          pincode: savedProfile.pincode,
          city: savedProfile.city,
          state: savedProfile.state,
          bio: savedProfile.bio,
          dob: savedProfile.dob,
          photos: savedProfile.photos,
          pets: savedProfile.pets,
        };
      } else {
        // New user from Apple
        finalUser = {
          id: credential.user,
          email: appleEmail,
          name: appleName,
          role: 'OWNER',
          onboardingComplete: false,
        };
      }

      logger.log('Apple user authenticated successfully');
      setUser(finalUser);
      await AsyncStorage.setItem('user', JSON.stringify(finalUser));
      await AsyncStorage.setItem(`userProfile_${finalUser.email}`, JSON.stringify(finalUser));

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
      if (user?.email) {
        await AsyncStorage.setItem(`userProfile_${user.email}`, JSON.stringify(user));
      }
      // Sign out from Google if available
      if (GoogleSignin) {
        try {
          await GoogleSignin.signOut();
        } catch (e) {
          // Ignore Google sign out errors
        }
      }
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      logger.error('Sign out error');
    } finally {
      setIsLoading(false);
    }
  }

  async function updateUserRole(role: string) {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      // Also save to persistent profile storage by email
      if (updatedUser.email) {
        await AsyncStorage.setItem(`userProfile_${updatedUser.email}`, JSON.stringify(updatedUser));
      }
    }
  }

  async function completeOnboarding() {
    if (user) {
      const updatedUser = { ...user, onboardingComplete: true };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      // Also save to persistent profile storage by email
      if (updatedUser.email) {
        await AsyncStorage.setItem(`userProfile_${updatedUser.email}`, JSON.stringify(updatedUser));
      }
    }
  }

  async function updateUserProfile(updates: Partial<User>) {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      // Also save to persistent profile storage by email (survives logout)
      if (updatedUser.email) {
        await AsyncStorage.setItem(`userProfile_${updatedUser.email}`, JSON.stringify(updatedUser));
      }
    }
  }

  // Demo account for App Store review
  // This creates a demo user with sample data for Apple reviewers
  async function signInWithDemoAccount() {
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

      setUser(demoUser);
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      await AsyncStorage.setItem(`userProfile_${demoUser.email}`, JSON.stringify(demoUser));
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
        signInWithGoogle,
        signInWithApple,
        isAppleAuthAvailable,
        signOut,
        updateUserRole,
        completeOnboarding,
        updateUserProfile,
        signInWithDemoAccount,
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
