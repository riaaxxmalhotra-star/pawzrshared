import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { bookingsApi } from '../lib/api';

const getRoleConfig = (role: string) => {
  switch (role) {
    case 'VET':
      return { title: 'Veterinarian', icon: 'medical', color: '#10B981' };
    case 'GROOMER':
      return { title: 'Pet Groomer', icon: 'cut', color: '#8B5CF6' };
    case 'SUPPLIER':
      return { title: 'Pet Supplier', icon: 'storefront', color: '#3B82F6' };
    case 'LOVER':
      return { title: 'Pet Lover', icon: 'heart', color: '#EC4899' };
    default:
      return { title: 'Pet Owner', icon: 'paw', color: colors.primary };
  }
};

interface ProfileStats {
  petsCount: number;
  bookingsCount: number;
  rating: number;
  ordersCount: number;
}

export default function ProfileScreen() {
  const { user, signOut, updateUserProfile } = useAuth();
  const navigation = useNavigation<any>();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  // Provider roles that show earnings
  const providerRoles = ['VET', 'GROOMER', 'SUPPLIER', 'LOVER'];
  // If role is NOT a provider role, treat as pet owner
  const isOwner = !providerRoles.includes(userRole);
  const roleConfig = getRoleConfig(userRole);
  const isAadhaarVerified = user?.aadhaarVerified || false;

  // Debug log
  console.log('ProfileScreen - user.role:', user?.role, 'userRole:', userRole, 'isOwner:', isOwner);
  const [stats, setStats] = useState<ProfileStats>({ petsCount: 0, bookingsCount: 0, rating: 0, ordersCount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Use pets from user data (saved during onboarding)
      const petsCount = user?.pets?.length || 0;

      const bookingsData = await bookingsApi.getMyBookings().catch(() => ({ bookings: [] }));

      setStats({
        petsCount: petsCount,
        bookingsCount: (bookingsData.bookings || bookingsData || []).length,
        ordersCount: 0, // Would come from orders API
        rating: isOwner ? 0 : (user?.rating || 4.9), // Only providers have ratings
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change profile photo');
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

  const handleMenuPress = (label: string) => {
    switch (label) {
      case 'Edit Profile':
        navigation.navigate('Home', { screen: 'EditProfile' });
        break;
      case 'Verification':
        navigation.navigate('Home', { screen: 'AadhaarVerification' });
        break;
      case 'Bookings':
        navigation.navigate('Home', { screen: 'Calendar' });
        break;
      default:
        break;
    }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', badge: null },
        { icon: 'shield-checkmark-outline', label: 'Verification', badge: isAadhaarVerified ? 'Verified' : 'Pending' },
        { icon: 'card-outline', label: 'Payment Methods', badge: null },
        { icon: 'location-outline', label: 'Addresses', badge: null },
      ],
    },
    {
      title: 'Activity',
      items: [
        { icon: 'calendar-outline', label: 'Bookings', badge: '3' },
        { icon: 'receipt-outline', label: 'Orders', badge: null },
        { icon: 'star-outline', label: 'Reviews', badge: null },
        { icon: 'heart-outline', label: 'Favorites', badge: null },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', toggle: true },
        { icon: 'moon-outline', label: 'Dark Mode', toggle: true },
        { icon: 'language-outline', label: 'Language', value: 'English' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', badge: null },
        { icon: 'chatbubble-outline', label: 'Contact Us', badge: null },
        { icon: 'document-text-outline', label: 'Terms & Privacy', badge: null },
        { icon: 'information-circle-outline', label: 'About Pawzr', badge: null },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={handleChangePhoto}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: `${roleConfig.color}15` }]}>
            <Ionicons name={roleConfig.icon as any} size={16} color={roleConfig.color} />
            <Text style={[styles.roleText, { color: roleConfig.color }]}>{roleConfig.title}</Text>
          </View>
        </View>

        {/* Stats - Different for Owners vs Providers */}
        <View style={styles.statsContainer}>
          {isOwner ? (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.petsCount}</Text>
                <Text style={styles.statLabel}>Pets</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.bookingsCount}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.ordersCount}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.bookingsCount}</Text>
                <Text style={styles.statLabel}>Clients</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>-</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
            </>
          )}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() => handleMenuPress(item.label)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={colors.gray[600]}
                      />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.badge && (
                      <View style={[
                        styles.badge,
                        item.badge === 'Pending' ? styles.pendingBadge :
                        item.badge === 'Verified' ? styles.verifiedBadge : styles.countBadge
                      ]}>
                        <Text style={[
                          styles.badgeText,
                          item.badge === 'Pending' ? styles.pendingText :
                          item.badge === 'Verified' ? styles.verifiedText : styles.countText
                        ]}>
                          {item.badge}
                        </Text>
                      </View>
                    )}
                    {item.value && (
                      <Text style={styles.menuItemValue}>{item.value}</Text>
                    )}
                    {item.toggle !== undefined ? (
                      <Switch
                        value={item.label === 'Notifications' ? notificationsEnabled : darkModeEnabled}
                        onValueChange={(value) => {
                          if (item.label === 'Notifications') {
                            setNotificationsEnabled(value);
                          } else {
                            setDarkModeEnabled(value);
                          }
                        }}
                        trackColor={{ false: colors.gray[200], true: `${colors.primary}50` }}
                        thumbColor={colors.primary}
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>Pawzr v1.0.0</Text>

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
  profileHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.gray[200],
    alignSelf: 'center',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
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
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 15,
    color: colors.gray[900],
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
    color: colors.gray[500],
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
  },
  countBadge: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingText: {
    color: '#D97706',
  },
  verifiedText: {
    color: '#059669',
  },
  countText: {
    color: colors.white,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
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
    marginTop: 20,
    fontSize: 12,
    color: colors.gray[400],
  },
});
