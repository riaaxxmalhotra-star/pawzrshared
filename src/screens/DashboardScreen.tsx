import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { FEATURES } from '../config/featureFlags';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isLover = userRole === 'LOVER';
  const isOwner = userRole === 'OWNER';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Pet Lover Dashboard - Bumble Style
  if (isLover) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>pawzr</Text>
            </View>
          </View>

          {/* Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
              <Text style={styles.welcomeName}>{user?.name?.split(' ')[0] || 'there'}</Text>
              <Text style={styles.welcomeSubtext}>Ready to meet some adorable pets?</Text>
            </View>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.welcomeAvatar} />
            ) : (
              <View style={styles.welcomeAvatarPlaceholder}>
                <Text style={styles.welcomeAvatarText}>
                  {user?.name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>

          {/* Start Matching CTA */}
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => navigation.navigate('Match')}
            activeOpacity={0.9}
          >
            <View style={styles.ctaIconContainer}>
              <Ionicons name="heart" size={40} color={colors.white} />
            </View>
            <Text style={styles.ctaTitle}>Start Matching</Text>
            <Text style={styles.ctaSubtext}>Swipe to find pets that need your love</Text>
            <View style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Let's Go</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💕</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🐾</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Pets Met</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>New</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.howItWorksCard}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Swipe & Match</Text>
                  <Text style={styles.stepText}>Like pets you want to meet</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Connect</Text>
                  <Text style={styles.stepText}>Chat with pet owners</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Meet & Play</Text>
                  <Text style={styles.stepText}>Schedule playdates or walks</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Pet Owner Dashboard - Bumble Style
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>pawzr</Text>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
            <Text style={styles.welcomeName}>{user?.name?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.welcomeSubtext}>What's your pet up to today?</Text>
          </View>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.welcomeAvatar} />
          ) : (
            <View style={styles.welcomeAvatarPlaceholder}>
              <Text style={styles.welcomeAvatarText}>
                {user?.name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
        </View>

        {/* My Pets Card */}
        <TouchableOpacity
          style={styles.petsCard}
          onPress={() => navigation.navigate('Pets')}
          activeOpacity={0.9}
        >
          <View style={styles.petsCardHeader}>
            <View style={styles.petsIconContainer}>
              <Ionicons name="paw" size={28} color={colors.white} />
            </View>
            <View style={styles.petsCardInfo}>
              <Text style={styles.petsCardTitle}>My Pets</Text>
              <Text style={styles.petsCardSubtext}>
                {user?.pets?.length || 0} {(user?.pets?.length || 0) === 1 ? 'pet' : 'pets'} registered
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </View>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Browse')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EC489915' }]}>
                <Ionicons name="heart" size={26} color="#EC4899" />
              </View>
              <Text style={styles.actionTitle}>Find Lovers</Text>
              <Text style={styles.actionSubtext}>Pet sitters & walkers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('MyPets')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="add-circle" size={26} color={colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Add Pet</Text>
              <Text style={styles.actionSubtext}>Register new pet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🐕</Text>
            <Text style={styles.statValue}>{user?.pets?.length || 0}</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💕</Text>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        {/* Tip Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Care Tip</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Daily Exercise</Text>
              <Text style={styles.tipText}>
                30 minutes of play keeps your pet happy and healthy!
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
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
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: colors.gray[500],
  },
  welcomeName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[900],
    marginTop: 2,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 4,
  },
  welcomeAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  welcomeAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  ctaCard: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  ctaSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  petsCard: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  petsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petsCardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  petsCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  petsCardSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
  },
  actionSubtext: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  howItWorksCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  stepContent: {
    flex: 1,
    marginLeft: 14,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  stepText: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  tipText: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 4,
    lineHeight: 18,
  },
});
