import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { FEATURES } from '../config/featureFlags';
import { getTabBarHeight, getTabBarFontSize, isTablet } from '../utils/responsive';

// Screens
import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PetsScreen from '../screens/PetsScreen';
import BrowseScreen from '../screens/BrowseScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import OnboardingNavigator from '../screens/onboarding';
import PetMatchScreen from '../screens/PetMatchScreen';
import LoverMatchScreen from '../screens/LoverMatchScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MyPetsScreen from '../screens/MyPetsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Hidden screens (ready for Phase 2+)
import ProviderListingsScreen from '../screens/ProviderListingsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AadhaarVerificationScreen from '../screens/AadhaarVerificationScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import PetCareTipScreen from '../screens/PetCareTipScreen';
import AddProductScreen from '../screens/AddProductScreen';
import OrdersScreen from '../screens/OrdersScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProviderProfileScreen from '../screens/ProviderProfileScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import VendorCRMScreen from '../screens/VendorCRMScreen';
import PawzrWalletScreen from '../screens/PawzrWalletScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Cafe & Events screens
import CafeDashboardScreen from '../screens/cafe/CafeDashboardScreen';
import CafeEventsScreen from '../screens/cafe/CafeEventsScreen';
import CreateEventScreen from '../screens/cafe/CreateEventScreen';
import CafeBookingsScreen from '../screens/cafe/CafeBookingsScreen';
import CafeCRMScreen from '../screens/cafe/CafeCRMScreen';
import CafeAnalyticsScreen from '../screens/cafe/CafeAnalyticsScreen';
import EventsListScreen from '../screens/EventsListScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import CafeDetailScreen from '../screens/CafeDetailScreen';

export type RootStackParamList = {
  Auth: undefined;
  RoleSelection: undefined;
  Onboarding: { role: string };
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  EditProfile: undefined;
  MyPets: undefined;
  Notifications: undefined;
  Browse: undefined;
  ProviderListings: undefined;
  // Provider screens
  Calendar: undefined;
  AadhaarVerification: undefined;
  Analytics: undefined;
  Earnings: undefined;
  PetCareTip: { type: 'hydration' | 'exercise' | 'nutrition' };
  AddProduct: undefined;
  Orders: undefined;
  Inventory: undefined;
  ProviderProfile: { provider: any };
  Appointments: undefined;
  // New screens
  Subscription: undefined;
  VendorCRM: undefined;
  PawzrWallet: undefined;
  // Cafe screens
  CafeEvents: undefined;
  CreateEvent: undefined;
  CafeBookings: undefined;
  CafeAnalytics: undefined;
  CafeCRM: undefined;
  EventDetail: { eventId: string };
  CafeDetail: { cafeId: string };
  EventsList: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Swipe: undefined;  // Role-based: Owners see LoverMatch, Lovers see PetMatch
  Events: undefined; // For OWNER/LOVER: browse events; For CAFE: manage events
  Bookings: undefined; // For CAFE: manage bookings
  Chat: undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  PawzrWallet: undefined;
  Subscription: undefined;
  AadhaarVerification: undefined;
  Settings: undefined;
  Notifications: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="EditProfile" component={EditProfileScreen} />
      <HomeStack.Screen name="MyPets" component={MyPetsScreen} />
      <HomeStack.Screen name="Browse" component={BrowseScreen} />
      {FEATURES.NOTIFICATIONS && (
        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      )}
      {/* Provider screens */}
      {FEATURES.PROVIDER_LISTINGS && <HomeStack.Screen name="ProviderListings" component={ProviderListingsScreen} />}
      {FEATURES.CALENDAR && <HomeStack.Screen name="Calendar" component={CalendarScreen} />}
      {FEATURES.AADHAAR_VERIFICATION && <HomeStack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen} />}
      {FEATURES.ANALYTICS && <HomeStack.Screen name="Analytics" component={AnalyticsScreen} />}
      {FEATURES.EARNINGS && <HomeStack.Screen name="Earnings" component={EarningsScreen} />}
      {FEATURES.PET_CARE_TIPS && <HomeStack.Screen name="PetCareTip" component={PetCareTipScreen} />}
      {FEATURES.ADD_PRODUCT && <HomeStack.Screen name="AddProduct" component={AddProductScreen} />}
      {FEATURES.ORDERS && <HomeStack.Screen name="Orders" component={OrdersScreen} />}
      {FEATURES.INVENTORY && <HomeStack.Screen name="Inventory" component={InventoryScreen} />}
      {FEATURES.PROVIDER_PROFILE && <HomeStack.Screen name="ProviderProfile" component={ProviderProfileScreen} />}
      {FEATURES.APPOINTMENTS && <HomeStack.Screen name="Appointments" component={AppointmentsScreen} />}
      {/* New platform screens */}
      <HomeStack.Screen name="Subscription" component={SubscriptionScreen} />
      <HomeStack.Screen name="VendorCRM" component={VendorCRMScreen} />
      <HomeStack.Screen name="PawzrWallet" component={PawzrWalletScreen} />
      {/* Events screens for consumers */}
      <HomeStack.Screen name="EventsList" component={EventsListScreen} />
      <HomeStack.Screen name="EventDetail" component={EventDetailScreen} />
      <HomeStack.Screen name="CafeDetail" component={CafeDetailScreen} />
    </HomeStack.Navigator>
  );
}

// Cafe Home Navigator - for CAFE role
function CafeHomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Dashboard" component={CafeDashboardScreen} />
      <HomeStack.Screen name="CafeEvents" component={CafeEventsScreen} />
      <HomeStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <HomeStack.Screen name="CafeBookings" component={CafeBookingsScreen} />
      <HomeStack.Screen name="CafeCRM" component={CafeCRMScreen} />
      <HomeStack.Screen name="CafeAnalytics" component={CafeAnalyticsScreen} />
      <HomeStack.Screen name="Analytics" component={AnalyticsScreen} />
      <HomeStack.Screen name="Earnings" component={EarningsScreen} />
      <HomeStack.Screen name="VendorCRM" component={VendorCRMScreen} />
      <HomeStack.Screen name="Subscription" component={SubscriptionScreen} />
      <HomeStack.Screen name="PawzrWallet" component={PawzrWalletScreen} />
      {FEATURES.NOTIFICATIONS && (
        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      )}
    </HomeStack.Navigator>
  );
}

// Profile Navigator - handles all profile-related screens
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="PawzrWallet" component={PawzrWalletScreen} />
      <ProfileStack.Screen name="Subscription" component={SubscriptionScreen} />
      <ProfileStack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

// Swipe screen that shows different content based on role
function SwipeScreen() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();

  // Pet Owners swipe through Pet Lovers
  // Pet Lovers swipe through Pets
  if (userRole === 'LOVER') {
    return <PetMatchScreen />;
  }
  return <LoverMatchScreen />;
}

// Role-specific colors
const roleColors: Record<string, string> = {
  OWNER: '#F97316',
  LOVER: '#F97316',    // Orange (same as Owner)
  VET: '#10B981',
  GROOMER: '#8B5CF6',
  SUPPLIER: '#3B82F6',
  CAFE: '#14B8A6',     // Teal
};

function MainNavigator() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isLover = userRole === 'LOVER';
  const isOwner = userRole === 'OWNER';
  const isCafe = userRole === 'CAFE';
  const isProvider = ['VET', 'GROOMER', 'SUPPLIER'].includes(userRole);
  const isConsumer = isOwner || isLover;
  const roleColor = roleColors[userRole] || colors.primary;

  // Get appropriate label for the second tab based on role
  const getSecondTabLabel = () => {
    switch (userRole) {
      case 'LOVER': return 'Match';
      case 'OWNER': return 'Find';
      case 'VET': return 'Schedule';
      case 'GROOMER': return 'Bookings';
      case 'SUPPLIER': return 'Orders';
      case 'CAFE': return 'Events';
      default: return 'Activity';
    }
  };

  // Get icon for second tab
  const getSecondTabIcon = (focused: boolean) => {
    switch (userRole) {
      case 'LOVER':
      case 'OWNER':
        return (
          <Ionicons
            name="heart"
            size={focused ? 28 : 24}
            color={focused ? roleColor : colors.gray[400]}
          />
        );
      case 'VET':
      case 'GROOMER':
        return (
          <Ionicons
            name={focused ? 'calendar' : 'calendar-outline'}
            size={focused ? 26 : 24}
            color={focused ? roleColor : colors.gray[400]}
          />
        );
      case 'SUPPLIER':
        return (
          <Ionicons
            name={focused ? 'receipt' : 'receipt-outline'}
            size={focused ? 26 : 24}
            color={focused ? roleColor : colors.gray[400]}
          />
        );
      case 'CAFE':
        return (
          <Ionicons
            name={focused ? 'calendar' : 'calendar-outline'}
            size={focused ? 26 : 24}
            color={focused ? roleColor : colors.gray[400]}
          />
        );
      default:
        return (
          <Ionicons
            name="heart"
            size={focused ? 28 : 24}
            color={focused ? roleColor : colors.gray[400]}
          />
        );
    }
  };

  // For CAFE role - different tab structure
  if (isCafe) {
    return (
      <MainTab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Events':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
              case 'Bookings':
                iconName = focused ? 'book' : 'book-outline';
                break;
              case 'Chat':
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                break;
              case 'ProfileTab':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'ellipse';
            }

            return (
              <View style={focused ? [styles.activeTab, { backgroundColor: `${roleColor}15` }] : undefined}>
                <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: roleColor,
          tabBarInactiveTintColor: colors.gray[400],
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: getTabBarFontSize(),
            fontWeight: '600',
            marginTop: -2,
            marginBottom: isTablet() ? 8 : 6,
          },
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.gray[100],
            borderTopWidth: 1,
            height: getTabBarHeight(),
            paddingTop: isTablet() ? 12 : 10,
            paddingHorizontal: isTablet() ? 40 : 0,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 10,
          },
        })}
      >
        <MainTab.Screen
          name="Home"
          component={CafeHomeNavigator}
          options={{ tabBarLabel: 'Home' }}
        />
        <MainTab.Screen
          name="Events"
          component={CafeEventsScreen}
          options={{ tabBarLabel: 'Events' }}
        />
        <MainTab.Screen
          name="Bookings"
          component={CafeBookingsScreen}
          options={{ tabBarLabel: 'Bookings' }}
        />
        <MainTab.Screen
          name="Chat"
          component={MessagesScreen}
          options={{
            tabBarLabel: 'Chat',
            tabBarBadge: 3,
            tabBarBadgeStyle: {
              backgroundColor: roleColor,
              fontSize: 10,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
        />
        <MainTab.Screen
          name="ProfileTab"
          component={ProfileNavigator}
          options={{ tabBarLabel: 'Profile' }}
        />
      </MainTab.Navigator>
    );
  }

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Swipe':
              return getSecondTabIcon(focused);
            case 'Events':
              return (
                <View style={focused ? [styles.activeTab, { backgroundColor: `${roleColor}15` }] : undefined}>
                  <Ionicons
                    name={focused ? 'calendar' : 'calendar-outline'}
                    size={focused ? 26 : 24}
                    color={color}
                  />
                </View>
              );
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <View style={focused ? [styles.activeTab, { backgroundColor: `${roleColor}15` }] : undefined}>
              <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: roleColor,
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: getTabBarFontSize(),
          fontWeight: '600',
          marginTop: -2,
          marginBottom: isTablet() ? 8 : 6,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          borderTopWidth: 1,
          height: getTabBarHeight(),
          paddingTop: isTablet() ? 12 : 10,
          paddingHorizontal: isTablet() ? 40 : 0,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
      })}
    >
      {/* Home */}
      <MainTab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ tabBarLabel: 'Home' }}
      />

      {/* Second Tab - Role-based content */}
      <MainTab.Screen
        name="Swipe"
        component={isProvider ? CalendarOrOrdersScreen : SwipeScreen}
        options={{
          tabBarLabel: getSecondTabLabel(),
          tabBarActiveTintColor: roleColor,
        }}
      />

      {/* Events Tab - For OWNER/LOVER only */}
      {isConsumer && (
        <MainTab.Screen
          name="Events"
          component={EventsListScreen}
          options={{ tabBarLabel: 'Events' }}
        />
      )}

      {/* Chat */}
      <MainTab.Screen
        name="Chat"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: roleColor,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
        }}
      />

      {/* Profile */}
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </MainTab.Navigator>
  );
}

// Provider's second tab - Calendar for Vet/Groomer, Orders for Supplier
function CalendarOrOrdersScreen() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();

  if (userRole === 'SUPPLIER') {
    return <OrdersScreen />;
  }
  return <CalendarScreen />;
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const needsRoleSelection = user && !user.onboardingComplete;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : needsRoleSelection ? (
          <>
            <RootStack.Screen name="RoleSelection" component={RoleSelectionScreen} />
            <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
            <RootStack.Screen name="Main" component={MainNavigator} />
          </>
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: `${colors.primary}15`,
    padding: 8,
    borderRadius: 16,
  },
});
