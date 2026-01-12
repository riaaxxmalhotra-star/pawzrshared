import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Pet Parent'}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="paw" size={28} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>My Pets</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar" size={28} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="medical" size={28} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Health</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="heart" size={28} color="#EF4444" />
              </View>
              <Text style={styles.actionText}>Care Tips</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.emptyState}>
              <Ionicons name="paw-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No recent activity</Text>
              <Text style={styles.emptySubtext}>Add your first pet to get started</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: colors.gray[500],
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[500],
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 4,
  },
});
