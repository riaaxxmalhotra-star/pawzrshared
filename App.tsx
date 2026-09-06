import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/lib/auth';
import AppNavigator from './src/navigation/AppNavigator';
import { navigateFromNotification } from './src/navigation/navigationRef';
import { initSentry, captureError, Sentry } from './src/lib/sentry';
import { validateEnv } from './src/config/env';
import {
  registerForPushNotifications,
  addNotificationResponseListener,
  getLaunchNotificationResponse,
  setBadgeCount,
} from './src/lib/notifications';
import logger from './src/lib/logger';

// Fail loudly (never silently) when required env is missing or placeholder.
// Non-blocking: the app still renders; Google sign-in will keep failing until fixed.
const envCheck = validateEnv();
if (!envCheck.valid) {
  const message = `Missing required env vars: ${envCheck.missing.join(', ')}. Copy .env.example to .env and fill them via EAS secrets.`;
  console.error(`[env] ${message}`);
  captureError(new Error(message));
  if (__DEV__) {
    Alert.alert('Environment misconfigured', message);
  }
}

// Initialize Sentry for error monitoring
initSentry();

// CRITICAL: Hide splash screen immediately on app start
// This prevents blank screen issues on iOS
SplashScreen.hideAsync().catch(() => {});

// Error Boundary to catch rendering errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('App crashed:', error.message);
    // Report to Sentry
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.icon}>⚠️</Text>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            The app encountered an error. Please try again.
          </Text>
          <TouchableOpacity style={errorStyles.button} onPress={this.handleRetry}>
            <Text style={errorStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFBF5',
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#F97316',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Hide splash screen again after mount (belt and suspenders)
    SplashScreen.hideAsync().catch(() => {});

    // Register for push notifications
    registerForPushNotifications().catch(() => {});

    // OTA updates: runtimeVersion policy is `appVersion`, so an update only
    // ever applies to the same native build — no version-skew risk. Check once
    // on launch in production builds; failures are silent by design and the
    // UI never blocks on this.
    if (!__DEV__ && Updates.isEnabled) {
      Updates.checkForUpdateAsync()
        .then(({ isAvailable }) => (isAvailable ? Updates.fetchUpdateAsync() : null))
        .then((result) => {
          if (result) Updates.reloadAsync().catch(() => {});
        })
        .catch(() => {});
    }

    // Route notification taps to the right screen (previously just logged).
    const subscription = addNotificationResponseListener((response) => {
      try {
        const data = response.notification.request.content.data as Record<string, any>;
        setBadgeCount(0).catch(() => {});
        navigateFromNotification(data);
      } catch (error) {
        logger.log('Notification routing failed');
      }
    });

    // Cold-start tap: the notification that launched the app (navigation may
    // not be ready yet, so retry briefly).
    let cancelled = false;
    getLaunchNotificationResponse()
      .then((response) => {
        if (cancelled || !response) return;
        const data = response.notification.request.content.data as Record<string, any>;
        let attempts = 0;
        const timer = setInterval(() => {
          attempts += 1;
          navigateFromNotification(data);
          if (attempts >= 10) clearInterval(timer);
        }, 500);
      })
      .catch(() => {});

    // Small delay then show app - no blocking operations
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  // Always render something - never return null or blank
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBF5',
  },
});

// Wrap app with Sentry for better error tracking
export default Sentry.wrap(App);
