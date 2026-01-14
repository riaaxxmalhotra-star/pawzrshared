import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { FEATURES } from '../config/featureFlags';

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
  // Hidden screens (Phase 2+)
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
};

export type MainTabParamList = {
  Home: undefined;
  Browse: undefined;
  Match: undefined;
  Pets: undefined;
  Messages: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
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
      {FEATURES.NOTIFICATIONS && (
        <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      )}
      {/* Hidden screens - available when feature flags enabled */}
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
    </HomeStack.Navigator>
  );
}

function MainNavigator() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isLover = userRole === 'LOVER';
  const isOwner = userRole === 'OWNER';

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Browse':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'Match':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Pets':
              iconName = focused ? 'paw' : 'paw-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <View style={focused ? styles.activeTab : undefined}>
              <Ionicons name={iconName} size={focused ? 26 : 24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: 6,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          borderTopWidth: 1,
          height: 85,
          paddingTop: 10,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
      })}
    >
      {/* Home - Always visible */}
      <MainTab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ tabBarLabel: 'Home' }}
      />

      {/* Browse/Explore - For Pet Owners */}
      {isOwner && FEATURES.BROWSE && (
        <MainTab.Screen
          name="Browse"
          component={BrowseScreen}
          options={{ tabBarLabel: 'Explore' }}
        />
      )}

      {/* Match - For Pet Lovers (Bumble-style swipe) */}
      {isLover && FEATURES.PET_MATCH && (
        <MainTab.Screen
          name="Match"
          component={PetMatchScreen}
          options={{
            tabBarLabel: 'Match',
            tabBarActiveTintColor: '#EC4899',
          }}
        />
      )}

      {/* Pets - For Pet Owners */}
      {isOwner && FEATURES.PETS && (
        <MainTab.Screen
          name="Pets"
          component={PetsScreen}
          options={{ tabBarLabel: 'My Pets' }}
        />
      )}

      {/* Messages - Hidden for now (Phase 2) */}
      {FEATURES.MESSAGES && (
        <MainTab.Screen
          name="Messages"
          component={MessagesScreen}
          options={{
            tabBarLabel: 'Chat',
            tabBarBadge: 3,
            tabBarBadgeStyle: {
              backgroundColor: colors.primary,
              fontSize: 10,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
            },
          }}
        />
      )}

      {/* Profile - Always visible */}
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </MainTab.Navigator>
  );
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
