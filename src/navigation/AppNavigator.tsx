import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useAuth } from '../lib/auth';
import { colors, roleColors, getRoleLightColor } from '../theme/colors';
import { FEATURES } from '../config/featureFlags';
import { getTabBarHeight, getTabBarFontSize, isTablet } from '../utils/responsive';
import { navigationRef } from './navigationRef';

// Deep links: pawzr://chat, pawzr://events, pawzr://events/<id>,
// pawzr://cafes/<id>, pawzr://bookings, pawzr://calendar, pawzr://orders.
const linking = {
  prefixes: ['pawzr://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              EventsList: 'events',
              EventDetail: 'events/:eventId',
              CafeDetail: 'cafes/:cafeId',
              Calendar: 'calendar',
              Orders: 'orders',
            },
          },
          Chat: 'chat',
          Events: 'events-tab',
          Bookings: 'bookings',
        },
      },
    },
  },
};

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
  // Optional match context: swipe screens pass the new match so Messages can
  // resolve (or create) the deterministic thread. Absent for the plain tab.
  Chat:
    | {
        matchedUser?: { id: string; name: string; type?: string; photo?: string };
        petName?: string;
        petId?: string;
      }
    | undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  MyPets: undefined;
  PawzrWallet: undefined;
  Subscription: undefined;
  AadhaarVerification: undefined;
  Settings: undefined;
  Notifications: undefined;
};

export type CafeEventsStackParamList = {
  CafeEvents: undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: string };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const CafeEventsStack = createNativeStackNavigator<CafeEventsStackParamList>();
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
      {/* Shared event screens: dashboard cards and deep links (pawzr://events,
          pawzr://events/<id>, pawzr://cafes/<id>) resolve under the Home tab. */}
      <HomeStack.Screen name="EventsList" component={EventsListScreen} />
      <HomeStack.Screen name="EventDetail" component={EventDetailScreen} />
      <HomeStack.Screen name="CafeDetail" component={CafeDetailScreen} />
      {FEATURES.NOTIFICATIONS && (
        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      )}
    </HomeStack.Navigator>
  );
}

// Cafe Events tab stack: CafeEventsScreen navigates to CreateEvent and
// EventDetail, so the tab must host all three — previously the tab rendered
// CafeEventsScreen directly and both navigations crashed.
function CafeEventsNavigator() {
  return (
    <CafeEventsStack.Navigator screenOptions={{ headerShown: false }}>
      <CafeEventsStack.Screen name="CafeEvents" component={CafeEventsScreen} />
      <CafeEventsStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <CafeEventsStack.Screen name="EventDetail" component={EventDetailScreen} />
    </CafeEventsStack.Navigator>
  );
}

// Profile Navigator - handles all profile-related screens
function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      {/* MyPets lives here (not just HomeStack) so ProfileScreen's "My Pets"
          menu item resolves — previously it navigated to an unregistered 'Pets'. */}
      <ProfileStack.Screen name="MyPets" component={MyPetsScreen} />
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

// Role colors come from the theme (`src/theme/colors.ts`) — the single source
// of truth shared with RoleSelection, onboarding, and Dashboard.

function MainNavigator() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isLover = userRole === 'LOVER';
  const isOwner = userRole === 'OWNER';
  const isCafe = userRole === 'CAFE';
  const isProvider = ['VET', 'GROOMER', 'SUPPLIER'].includes(userRole);
  const isConsumer = isOwner || isLover;
  const roleColor = roleColors[userRole as keyof typeof roleColors] || colors.primary;
  const roleTint = getRoleLightColor(userRole);
  // Reactive dimensions: static Dimensions.get() freezes at launch and breaks
  // on rotation — useWindowDimensions re-renders the tab bar instead.
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const tabletLayout = isTablet({ width: winWidth, height: winHeight });

  // Get appropriate label for the second tab based on role
  const getSecondTabLabel = () => {
    switch (userRole) {
      case 'LOVER': return 'Match';
      case 'OWNER': return 'Find';
      case 'VET': return 'Schedule';
      case 'GROOMER': return 'Schedule';
      case 'SUPPLIER': return 'Orders';
      case 'CAFE': return 'Events';
      default: return 'Activity';
    }
  };

  // Get icon for second tab - ALWAYS use consistent wrapper to prevent visual shrinking
  const getSecondTabIcon = (focused: boolean) => {
    const wrapperStyle = [
      styles.tabIconWrapper,
      focused && { backgroundColor: roleTint }
    ];

    switch (userRole) {
      case 'LOVER':
      case 'OWNER':
        return (
          <View style={wrapperStyle}>
            <Ionicons
              name="heart"
              size={24}
              color={focused ? roleColor : colors.gray[400]}
            />
          </View>
        );
      case 'VET':
      case 'GROOMER':
        return (
          <View style={wrapperStyle}>
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={focused ? roleColor : colors.gray[400]}
            />
          </View>
        );
      case 'SUPPLIER':
        return (
          <View style={wrapperStyle}>
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={24}
              color={focused ? roleColor : colors.gray[400]}
            />
          </View>
        );
      case 'CAFE':
        return (
          <View style={wrapperStyle}>
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={focused ? roleColor : colors.gray[400]}
            />
          </View>
        );
      default:
        return (
          <View style={wrapperStyle}>
            <Ionicons
              name="heart"
              size={24}
              color={focused ? roleColor : colors.gray[400]}
            />
          </View>
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

            // ALWAYS use consistent wrapper to prevent visual shrinking
            return (
              <View style={[styles.tabIconWrapper, focused && { backgroundColor: roleTint }]}>
                <Ionicons name={iconName} size={24} color={color} />
              </View>
            );
          },
          tabBarActiveTintColor: roleColor,
          tabBarInactiveTintColor: colors.gray[500],
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: getTabBarFontSize(),
            fontWeight: '600',
            marginTop: -2,
            marginBottom: tabletLayout ? 8 : 6,
          },
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.gray[100],
            borderTopWidth: 1,
            height: getTabBarHeight(),
            paddingTop: tabletLayout ? 12 : 10,
            paddingHorizontal: tabletLayout ? 40 : 0,
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
          options={{ tabBarLabel: 'Home', tabBarAccessibilityLabel: 'Home' }}
        />
        <MainTab.Screen
          name="Events"
          component={CafeEventsNavigator}
          options={{ tabBarLabel: 'Events', tabBarAccessibilityLabel: 'Events, manage your events' }}
        />
        <MainTab.Screen
          name="Bookings"
          component={CafeBookingsScreen}
          options={{ tabBarLabel: 'Bookings', tabBarAccessibilityLabel: 'Bookings, manage table bookings' }}
        />
        <MainTab.Screen
          name="Chat"
          component={MessagesScreen}
          // No badge: there is no unread-count source, so a static badge would lie.
          options={{
            tabBarLabel: 'Chat',
            tabBarAccessibilityLabel: 'Chat, your conversations',
          }}
        />
        <MainTab.Screen
          name="ProfileTab"
          component={ProfileNavigator}
          options={{ tabBarLabel: 'Profile', tabBarAccessibilityLabel: 'Profile, your account' }}
        />
      </MainTab.Navigator>
    );
  }

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Swipe':
              return getSecondTabIcon(focused);
            case 'Events':
              // ALWAYS use consistent wrapper to prevent visual shrinking
              return (
                <View style={[styles.tabIconWrapper, focused && { backgroundColor: roleTint }]}>
                  <Ionicons
                    name={focused ? 'calendar' : 'calendar-outline'}
                    size={24}
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

          // ALWAYS use consistent wrapper to prevent visual shrinking
          return (
            <View style={[styles.tabIconWrapper, focused && { backgroundColor: roleTint }]}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: roleColor,
        tabBarInactiveTintColor: colors.gray[500],
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: getTabBarFontSize(),
          fontWeight: '600',
          marginTop: -2,
          marginBottom: tabletLayout ? 8 : 6,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          borderTopWidth: 1,
          height: getTabBarHeight(),
          paddingTop: tabletLayout ? 12 : 10,
          paddingHorizontal: tabletLayout ? 40 : 0,
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
        options={{ tabBarLabel: 'Home', tabBarAccessibilityLabel: 'Home' }}
      />

      {/* Second Tab - Role-based content */}
      <MainTab.Screen
        name="Swipe"
        component={isProvider ? CalendarOrOrdersScreen : SwipeScreen}
        options={{
          tabBarLabel: getSecondTabLabel(),
          tabBarActiveTintColor: roleColor,
          tabBarAccessibilityLabel: `${getSecondTabLabel()}, second tab`,
        }}
      />

      {/* Events Tab - For OWNER/LOVER only */}
      {isConsumer && (
        <MainTab.Screen
          name="Events"
          component={EventsListScreen}
          options={{ tabBarLabel: 'Events', tabBarAccessibilityLabel: 'Events, browse pet events' }}
        />
      )}

      {/* Chat */}
      <MainTab.Screen
        name="Chat"
        component={MessagesScreen}
        // No badge: there is no unread-count source, so a static badge would lie.
        options={{
          tabBarLabel: 'Chat',
          tabBarAccessibilityLabel: 'Chat, your conversations',
        }}
      />

      {/* Profile */}
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Profile', tabBarAccessibilityLabel: 'Profile, your account' }}
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
  // Gate the full-screen loader on restore only: interactive sign-in spinners
  // (isLoading) must never unmount navigation and lose its state.
  const { user, isRestoring } = useAuth();

  if (isRestoring) {
    return <LoadingScreen />;
  }

  const needsRoleSelection = user && !user.onboardingComplete;

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
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
  // Always use this wrapper - consistent size prevents icon "shrinking"
  tabIconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});
