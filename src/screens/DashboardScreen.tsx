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

const { width } = Dimensions.get('window');

// Role-specific colors
const roleColors = {
  OWNER: '#F97316',
  LOVER: '#F97316',    // Orange (same as Owner)
  VET: '#10B981',
  GROOMER: '#8B5CF6',
  SUPPLIER: '#3B82F6',
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const userRole = (user?.role || 'OWNER').toUpperCase();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const roleColor = roleColors[userRole as keyof typeof roleColors] || colors.primary;

  // Vet Dashboard
  if (userRole === 'VET') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Welcome Card */}
          <View style={[styles.welcomeCard, { borderLeftWidth: 4, borderLeftColor: roleColor }]}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
              <Text style={styles.welcomeName}>Dr. {user?.name?.split(' ')[0] || 'there'}</Text>
              <Text style={styles.welcomeSubtext}>Your clinic is ready for patients</Text>
            </View>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={[styles.welcomeAvatar, { borderColor: roleColor }]} />
            ) : (
              <View style={[styles.welcomeAvatarPlaceholder, { backgroundColor: roleColor }]}>
                <Text style={styles.welcomeAvatarText}>{user?.name?.charAt(0) || '?'}</Text>
              </View>
            )}
          </View>

          {/* Today's Overview */}
          <View style={[styles.overviewCard, { backgroundColor: roleColor }]}>
            <Text style={styles.overviewTitle}>Today's Overview</Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Appointments</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Pending</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Completed</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Calendar')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="calendar" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Calendar</Text>
                <Text style={styles.actionSubtext}>Manage bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ProviderListings')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="medical" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Services</Text>
                <Text style={styles.actionSubtext}>Manage services</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VendorCRM')}>
                <View style={[styles.actionIcon, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="people" size={26} color="#3B82F6" />
                </View>
                <Text style={styles.actionTitle}>CRM</Text>
                <Text style={styles.actionSubtext}>Manage patients</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Analytics')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="stats-chart" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Analytics</Text>
                <Text style={styles.actionSubtext}>View insights</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Earnings')}>
                <View style={[styles.actionIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="wallet" size={26} color="#F59E0B" />
                </View>
                <Text style={styles.actionTitle}>Earnings</Text>
                <Text style={styles.actionSubtext}>Track revenue</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Subscription')}>
                <View style={[styles.actionIcon, { backgroundColor: '#8B5CF615' }]}>
                  <Ionicons name="diamond" size={26} color="#8B5CF6" />
                </View>
                <Text style={styles.actionTitle}>Upgrade</Text>
                <Text style={styles.actionSubtext}>Pro features</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🏥</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>New</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Groomer Dashboard
  if (userRole === 'GROOMER') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Welcome Card */}
          <View style={[styles.welcomeCard, { borderLeftWidth: 4, borderLeftColor: roleColor }]}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
              <Text style={styles.welcomeName}>{user?.name?.split(' ')[0] || 'there'}</Text>
              <Text style={styles.welcomeSubtext}>Ready to make pets beautiful!</Text>
            </View>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={[styles.welcomeAvatar, { borderColor: roleColor }]} />
            ) : (
              <View style={[styles.welcomeAvatarPlaceholder, { backgroundColor: roleColor }]}>
                <Text style={styles.welcomeAvatarText}>{user?.name?.charAt(0) || '?'}</Text>
              </View>
            )}
          </View>

          {/* Today's Overview */}
          <View style={[styles.overviewCard, { backgroundColor: roleColor }]}>
            <Text style={styles.overviewTitle}>Today's Sessions</Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Bookings</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Pending</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Done</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Calendar')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="calendar" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Calendar</Text>
                <Text style={styles.actionSubtext}>Manage bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ProviderListings')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="cut" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Services</Text>
                <Text style={styles.actionSubtext}>Grooming packages</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VendorCRM')}>
                <View style={[styles.actionIcon, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="people" size={26} color="#3B82F6" />
                </View>
                <Text style={styles.actionTitle}>CRM</Text>
                <Text style={styles.actionSubtext}>Manage clients</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Analytics')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="stats-chart" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Analytics</Text>
                <Text style={styles.actionSubtext}>View insights</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Earnings')}>
                <View style={[styles.actionIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="wallet" size={26} color="#F59E0B" />
                </View>
                <Text style={styles.actionTitle}>Earnings</Text>
                <Text style={styles.actionSubtext}>Track revenue</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Subscription')}>
                <View style={[styles.actionIcon, { backgroundColor: '#8B5CF615' }]}>
                  <Ionicons name="diamond" size={26} color="#8B5CF6" />
                </View>
                <Text style={styles.actionTitle}>Upgrade</Text>
                <Text style={styles.actionSubtext}>Pro features</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✂️</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>New</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Supplier Dashboard
  if (userRole === 'SUPPLIER') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Welcome Card */}
          <View style={[styles.welcomeCard, { borderLeftWidth: 4, borderLeftColor: roleColor }]}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
              <Text style={styles.welcomeName}>{user?.name?.split(' ')[0] || 'there'}</Text>
              <Text style={styles.welcomeSubtext}>Your store is open for business</Text>
            </View>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={[styles.welcomeAvatar, { borderColor: roleColor }]} />
            ) : (
              <View style={[styles.welcomeAvatarPlaceholder, { backgroundColor: roleColor }]}>
                <Text style={styles.welcomeAvatarText}>{user?.name?.charAt(0) || '?'}</Text>
              </View>
            )}
          </View>

          {/* Today's Overview */}
          <View style={[styles.overviewCard, { backgroundColor: roleColor }]}>
            <Text style={styles.overviewTitle}>Today's Orders</Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>New</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Processing</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewValue}>0</Text>
                <Text style={styles.overviewLabel}>Shipped</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Orders')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="receipt" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Orders</Text>
                <Text style={styles.actionSubtext}>Manage orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Inventory')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="cube" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Inventory</Text>
                <Text style={styles.actionSubtext}>Stock levels</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ProviderListings')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="pricetag" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Products</Text>
                <Text style={styles.actionSubtext}>Add products</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('VendorCRM')}>
                <View style={[styles.actionIcon, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="people" size={26} color="#10B981" />
                </View>
                <Text style={styles.actionTitle}>CRM</Text>
                <Text style={styles.actionSubtext}>Manage customers</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Earnings')}>
                <View style={[styles.actionIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="wallet" size={26} color="#F59E0B" />
                </View>
                <Text style={styles.actionTitle}>Revenue</Text>
                <Text style={styles.actionSubtext}>Track sales</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Subscription')}>
                <View style={[styles.actionIcon, { backgroundColor: '#8B5CF615' }]}>
                  <Ionicons name="diamond" size={26} color="#8B5CF6" />
                </View>
                <Text style={styles.actionTitle}>Upgrade</Text>
                <Text style={styles.actionSubtext}>Pro features</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📦</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🛒</Text>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>

          {/* Inventory Alert */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Status</Text>
            <View style={[styles.tipCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.tipEmoji}>📋</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>All products in stock</Text>
                <Text style={styles.tipText}>
                  Add products to your store to start selling!
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Pet Lover Dashboard
  if (userRole === 'LOVER') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Welcome Card */}
          <View style={[styles.welcomeCard, { borderLeftWidth: 4, borderLeftColor: roleColor }]}>
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
              <Text style={styles.welcomeName}>{user?.name?.split(' ')[0] || 'there'}</Text>
              <Text style={styles.welcomeSubtext}>Ready to meet some adorable pets?</Text>
            </View>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={[styles.welcomeAvatar, { borderColor: roleColor }]} />
            ) : (
              <View style={[styles.welcomeAvatarPlaceholder, { backgroundColor: roleColor }]}>
                <Text style={styles.welcomeAvatarText}>{user?.name?.charAt(0) || '?'}</Text>
              </View>
            )}
          </View>

          {/* Start Matching CTA */}
          <TouchableOpacity
            style={[styles.ctaCard, { backgroundColor: roleColor }]}
            onPress={() => navigation.getParent()?.navigate('Swipe')}
            activeOpacity={0.9}
          >
            <View style={styles.ctaIconContainer}>
              <Ionicons name="heart" size={40} color={colors.white} />
            </View>
            <Text style={styles.ctaTitle}>Start Matching</Text>
            <Text style={styles.ctaSubtext}>Swipe to find pets that need your love</Text>
            <View style={styles.ctaButton}>
              <Text style={[styles.ctaButtonText, { color: roleColor }]}>Let's Go</Text>
              <Ionicons name="arrow-forward" size={20} color={roleColor} />
            </View>
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Calendar')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="calendar" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Calendar</Text>
                <Text style={styles.actionSubtext}>My schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Earnings')}>
                <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                  <Ionicons name="cash" size={26} color={roleColor} />
                </View>
                <Text style={styles.actionTitle}>Earnings</Text>
                <Text style={styles.actionSubtext}>Track income</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PawzrWallet')}>
                <View style={[styles.actionIcon, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="wallet" size={26} color="#10B981" />
                </View>
                <Text style={styles.actionTitle}>Wallet</Text>
                <Text style={styles.actionSubtext}>Rewards & points</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Browse')}>
                <View style={[styles.actionIcon, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="search" size={26} color="#3B82F6" />
                </View>
                <Text style={styles.actionTitle}>Browse</Text>
                <Text style={styles.actionSubtext}>Find services</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                <View style={[styles.stepNumber, { backgroundColor: roleColor }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Swipe & Match</Text>
                  <Text style={styles.stepText}>Like pets you want to meet</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: roleColor }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Connect</Text>
                  <Text style={styles.stepText}>Chat with pet owners</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: roleColor }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Meet & Earn</Text>
                  <Text style={styles.stepText}>Walk, sit, and get paid</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Pet Owner Dashboard (default)
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Card */}
        <View style={[styles.welcomeCard, { borderLeftWidth: 4, borderLeftColor: roleColor }]}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeGreeting}>{getGreeting()},</Text>
            <Text style={styles.welcomeName}>{user?.name?.split(' ')[0] || 'there'}</Text>
            <Text style={styles.welcomeSubtext}>What's your pet up to today?</Text>
          </View>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={[styles.welcomeAvatar, { borderColor: roleColor }]} />
          ) : (
            <View style={[styles.welcomeAvatarPlaceholder, { backgroundColor: roleColor }]}>
              <Text style={styles.welcomeAvatarText}>{user?.name?.charAt(0) || '?'}</Text>
            </View>
          )}
        </View>

        {/* My Pets Card */}
        <TouchableOpacity
          style={[styles.petsCard, { backgroundColor: roleColor }]}
          onPress={() => navigation.navigate('MyPets')}
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
              onPress={() => navigation.getParent()?.navigate('Swipe')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F9731615' }]}>
                <Ionicons name="heart" size={26} color="#F97316" />
              </View>
              <Text style={styles.actionTitle}>Find Lovers</Text>
              <Text style={styles.actionSubtext}>Pet sitters & walkers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('MyPets')}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${roleColor}15` }]}>
                <Ionicons name="add-circle" size={26} color={roleColor} />
              </View>
              <Text style={styles.actionTitle}>Add Pet</Text>
              <Text style={styles.actionSubtext}>Register new pet</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Appointments')}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="calendar" size={26} color="#10B981" />
              </View>
              <Text style={styles.actionTitle}>Appointments</Text>
              <Text style={styles.actionSubtext}>Vet & groomer visits</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Browse')}>
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="search" size={26} color="#3B82F6" />
              </View>
              <Text style={styles.actionTitle}>Browse</Text>
              <Text style={styles.actionSubtext}>Find services</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PawzrWallet')}>
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="wallet" size={26} color="#8B5CF6" />
              </View>
              <Text style={styles.actionTitle}>Wallet</Text>
              <Text style={styles.actionSubtext}>Rewards & cashback</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Notifications')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F5970B15' }]}>
                <Ionicons name="notifications" size={26} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>Alerts</Text>
              <Text style={styles.actionSubtext}>Notifications</Text>
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
  },
  welcomeAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  overviewCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  overviewLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  ctaCard: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
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
  },
  petsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 12,
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
