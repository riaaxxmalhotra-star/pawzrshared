import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from './api';

WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_WEB_CLIENT_ID = '1094158533320-aumh0qgrr06o0o17umlulthgj3m72dlq.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '1094158533320-7fugh8bijpp1770uo21b0ubf8f36odp1.apps.googleusercontent.com';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Google Auth - using Expo proxy for Expo Go compatibility
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

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

      const result = await authApi.googleToken(
        authentication.idToken || '',
        authentication.accessToken
      );

      console.log('API response:', JSON.stringify(result, null, 2));

      if (result.user) {
        setUser(result.user);
        await AsyncStorage.setItem('user', JSON.stringify(result.user));
        await AsyncStorage.setItem('token', result.token || '');
      }
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

  async function signOut() {
    try {
      setIsLoading(true);
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
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signOut,
        updateUserRole,
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
