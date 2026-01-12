import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Ionicons name="paw" size={60} color={colors.primary} />
      </View>
      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
});
