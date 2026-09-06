import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, isAppleAuthAvailable, isLoading, signInWithDemoAccount } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="paw" size={80} color={colors.primary} />
          </View>
          <Text style={styles.title}>Pawzr</Text>
          <Text style={styles.subtitle}>Your Pet's Best Companion</Text>
        </View>

        {/* Auth Buttons */}
        <View style={styles.authButtons}>
          {/* Apple Sign In - iOS only */}
          {Platform.OS === 'ios' && isAppleAuthAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={signInWithApple}
            />
          )}

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={signInWithGoogle}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.gray[700]} />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://www.google.com/favicon.ico' }}
                  style={styles.buttonIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Demo - For investors & reviewers */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() =>
              signInWithDemoAccount().catch((error: unknown) =>
                Alert.alert(
                  'Demo unavailable',
                  error instanceof Error ? error.message : 'Could not start the demo account.'
                )
              )
            }
            disabled={isLoading}
          >
            <Ionicons name="rocket" size={20} color={colors.white} />
            <Text style={styles.demoButtonText}>Try Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.termsLink}
            onPress={() => WebBrowser.openBrowserAsync('https://pawzrpro.vercel.app/terms')}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={styles.termsLink}
            onPress={() => WebBrowser.openBrowserAsync('https://pawzrpro.vercel.app/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.gray[500],
  },
  authButtons: {
    gap: 16,
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 12,
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  terms: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 12,
    color: colors.gray[400],
    paddingHorizontal: 20,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
