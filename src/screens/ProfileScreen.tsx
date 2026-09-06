import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { user, signOut, updateUserProfile } = useAuth();
  const navigation = useNavigation<any>();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isLover = userRole === 'LOVER';
  const isProvider = ['VET', 'GROOMER', 'SUPPLIER'].includes(userRole);

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateUserProfile({ image: result.assets[0].uri });
      Alert.alert('Success', 'Profile photo updated!');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handleChangePhoto}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            {user?.aadhaarVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Ionicons
              name={
                isProvider
                  ? userRole === 'VET' ? 'medical' : userRole === 'GROOMER' ? 'cut' : 'storefront'
                  : isLover ? 'heart' : 'paw'
              }
              size={16}
              color={
                isProvider
                  ? userRole === 'VET' ? '#10B981' : userRole === 'GROOMER' ? '#8B5CF6' : '#3B82F6'
                  : isLover ? '#F97316' : colors.primary
              }
            />
            <Text style={[styles.roleText, {
              color: isProvider
                ? userRole === 'VET' ? '#10B981' : userRole === 'GROOMER' ? '#8B5CF6' : '#3B82F6'
                : isLover ? '#F97316' : colors.primary
            }]}>
              {isProvider
                ? userRole === 'VET' ? 'Veterinarian' : userRole === 'GROOMER' ? 'Pet Groomer' : 'Pet Supplier'
                : isLover ? 'Pet Lover' : 'Pet Owner'}
            </Text>
          </View>

          {/* Trust Badges Row */}
          <View style={styles.trustBadgesRow}>
            {user?.aadhaarVerified && (
              <View style={[styles.trustBadge, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={[styles.trustBadgeText, { color: '#10B981' }]}>ID Verified</Text>
              </View>
            )}
            <View style={[styles.trustBadge, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="mail" size={14} color="#3B82F6" />
              <Text style={[styles.trustBadgeText, { color: '#3B82F6' }]}>Email</Text>
            </View>
            {(user as any)?.phoneVerified && (
              <View style={[styles.trustBadge, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="call" size={14} color="#8B5CF6" />
                <Text style={[styles.trustBadgeText, { color: '#8B5CF6' }]}>Phone</Text>
              </View>
            )}
            {isProvider && (
              <View style={[styles.trustBadge, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="diamond" size={14} color="#F59E0B" />
                <Text style={[styles.trustBadgeText, { color: '#F59E0B' }]}>Pro</Text>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isLover ? '0' : (user?.pets?.length || 0)}</Text>
              <Text style={styles.statLabel}>{isLover ? 'Matches' : 'Pets'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>{isLover ? 'Pets Met' : 'Bookings'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{isLover ? 'New' : '0'}</Text>
              <Text style={styles.statLabel}>{isLover ? 'Rating' : 'Reviews'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PawzrWallet')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="wallet-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.menuLabel}>Pawzr Wallet</Text>
                <Text style={styles.menuSubLabel}>Rewards, cashback & loyalty</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          {/* Only show Subscription/Growth Plans for providers (VET, GROOMER, SUPPLIER) */}
          {isProvider && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Subscription')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="diamond-outline" size={20} color="#F59E0B" />
                </View>
                <View>
                  <Text style={styles.menuLabel}>Growth Plans</Text>
                  <Text style={styles.menuSubLabel}>
                    Upgrade to reduce commission
                  </Text>
                </View>
              </View>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>Pro</Text>
              </View>
            </TouchableOpacity>
          )}

          {!isLover && !isProvider && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('MyPets')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F9731615' }]}>
                  <Ionicons name="paw-outline" size={20} color="#F97316" />
                </View>
                <Text style={styles.menuLabel}>My Pets</Text>
              </View>
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{user?.pets?.length || 0}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="notifications-outline" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.menuLabel}>Notifications</Text>
                <Text style={styles.menuSubLabel}>Manage your alerts</Text>
              </View>
            </View>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.gray[100] }]}>
                <Ionicons name="settings-outline" size={20} color={colors.gray[600]} />
              </View>
              <Text style={styles.menuLabel}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AadhaarVerification')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.menuLabel}>Aadhaar Verification</Text>
                <Text style={styles.menuSubLabel}>
                  {user?.aadhaarVerified ? 'Verified' : 'Get verified to build trust'}
                </Text>
              </View>
            </View>
            {user?.aadhaarVerified ? (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            ) : (
              <View style={styles.verifyNowBadge}>
                <Text style={styles.verifyNowText}>Verify</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.menuLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>pawzr v1.3.0</Text>

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
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.white,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[100],
  },
  menuSection: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[900],
  },
  menuSubLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  verifyNowBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  verifyNowText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  menuBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  menuBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  proBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  notifBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  notifBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 18,
    borderRadius: 20,
    gap: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
    color: colors.gray[400],
    fontWeight: '500',
  },
});
