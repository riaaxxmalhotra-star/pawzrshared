import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { authApi } from './api';

WebBrowser.maybeCompleteAuthSession();

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_WEB_CLIENT_ID = '1094158533320-aumh0qgrr06o0o17umlulthgj3m72dlq.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '1094158533320-7fugh8bijpp1770uo21b0ubf8f36odp1.apps.googleusercontent.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  // Google Auth - using Expo proxy for Expo Go compatibility
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  // Check Apple Auth availability on iOS
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
    }
  }, []);

  // Check for stored user on mount
  useEffect(() => {
    checkStoredUser();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSuccess(response.authentication);
    }
  }, [response]);

  async function checkStoredUser() {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking stored user:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSuccess(authentication: any) {
    try {
      setIsLoading(true);
      console.log('Google auth response:', JSON.stringify(authentication, null, 2));

      if (!authentication?.accessToken) {
        console.error('No access token received from Google');
        throw new Error('No access token');
      }

      // First, try to get user info from Google directly
      let googleUser = null;
      try {
        const googleResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        });
        if (googleResponse.ok) {
          googleUser = await googleResponse.json();
          console.log('Google user info:', JSON.stringify(googleUser, null, 2));
        }
      } catch (googleError) {
        console.error('Failed to fetch Google user info:', googleError);
      }

      // Try to sync with backend API
      let apiUser = null;
      try {
        const result = await authApi.googleToken(
          authentication.idToken || '',
          authentication.accessToken
        );
        console.log('API response:', JSON.stringify(result, null, 2));

        if (result.user) {
          apiUser = result.user;
          await AsyncStorage.setItem('token', result.token || '');
        }
      } catch (apiError: any) {
        console.log('Backend API unavailable, using local auth:', apiError.message);
      }

      // Determine final user - always check persistent storage first
      let finalUser: User;

      // Get email from either source
      const userEmail = apiUser?.email || googleUser?.email;

      if (!userEmail) {
        throw new Error('Failed to get user email');
      }

      // ALWAYS check persistent profile storage first (survives logout/login)
      const savedProfileData = await AsyncStorage.getItem(`userProfile_${userEmail}`);

      if (savedProfileData) {
        // Found saved profile - this user has logged in before
        const savedProfile = JSON.parse(savedProfileData);
        console.log('Restoring saved profile for:', userEmail);
        console.log('Saved profile data:', JSON.stringify(savedProfile, null, 2));

        // Merge: saved profile is base, update with fresh auth data (but preserve onboarding fields)
        finalUser = {
          ...savedProfile,
          // Update with fresh data from auth source
          id: apiUser?.id || googleUser?.id || savedProfile.id,
          name: apiUser?.name || googleUser?.name || savedProfile.name,
          image: apiUser?.image || googleUser?.picture || savedProfile.image,
          // ALWAYS preserve these from saved profile
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
        // No saved profile, use API user
        finalUser = apiUser;
      } else if (googleUser) {
        // No saved profile, no API user - create new from Google
        finalUser = {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name || '',
          role: 'OWNER',
          image: googleUser.picture,
          onboardingComplete: false,
        };
      } else {
        throw new Error('Failed to get user information');
      }

      console.log('Final user:', JSON.stringify(finalUser, null, 2));
      setUser(finalUser);
      await AsyncStorage.setItem('user', JSON.stringify(finalUser));
      // Also save to persistent profile storage (survives logout)
      await AsyncStorage.setItem(`userProfile_${finalUser.email}`, JSON.stringify(finalUser));
    } catch (error: any) {
      console.error('Google sign in error:', error.message || error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
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

      console.log('Apple auth credential:', JSON.stringify(credential, null, 2));

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
        console.log('Restoring saved profile for:', appleEmail);
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

      console.log('Final user from Apple:', JSON.stringify(finalUser, null, 2));
      setUser(finalUser);
      await AsyncStorage.setItem('user', JSON.stringify(finalUser));
      await AsyncStorage.setItem(`userProfile_${finalUser.email}`, JSON.stringify(finalUser));

    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        console.log('Apple Sign In was cancelled');
      } else {
        console.error('Apple sign in error:', error);
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
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
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
