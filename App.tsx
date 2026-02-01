import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/lib/auth';
import AppNavigator from './src/navigation/AppNavigator';

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

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Hide splash screen again after mount (belt and suspenders)
    SplashScreen.hideAsync().catch(() => {});

    // Small delay then show app - no blocking operations
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
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
