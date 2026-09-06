import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface ComingSoonPanelProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  color?: string;
}

// Honest placeholder for money/payment surfaces with no backend yet
// (wallet, payouts, rewards, subscriptions). Replaces hardcoded balances and
// dead buttons that previously claimed fake success.
export default function ComingSoonPanel({
  icon = 'wallet-outline',
  title,
  body,
  color = colors.primary,
}: ComingSoonPanelProps) {
  return (
    <View style={styles.panel}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={40} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.badge}>
        <Text style={[styles.badgeText, { color }]}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
