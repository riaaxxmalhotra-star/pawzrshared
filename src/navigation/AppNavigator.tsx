import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

// Screens
import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PetsScreen from '../screens/PetsScreen';
import BrowseScreen from '../screens/BrowseScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProviderListingsScreen from '../screens/ProviderListingsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AadhaarVerificationScreen from '../screens/AadhaarVerificationScreen';

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  AadhaarVerification: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Browse: undefined;
  Pets: undefined;
  Listings: undefined;
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
      <HomeStack.Screen name="Calendar" component={CalendarScreen} />
      <HomeStack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen} />
    </HomeStack.Navigator>
  );
}

function MainNavigator() {
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const providerRoles = ['VET', 'GROOMER', 'SUPPLIER', 'LOVER'];
  const isProvider = providerRoles.includes(userRole);

  // Get provider-specific icon and color
  const getProviderConfig = () => {
    switch (userRole) {
      case 'VET':
        return { icon: 'medical', color: '#10B981', label: 'Services' };
      case 'GROOMER':
        return { icon: 'cut', color: '#8B5CF6', label: 'Services' };
      case 'SUPPLIER':
        return { icon: 'storefront', color: '#3B82F6', label: 'Products' };
      case 'LOVER':
        return { icon: 'heart', color: '#EC4899', label: 'Services' };
      default:
        return { icon: 'list', color: colors.primary, label: 'Listings' };
    }
  };

  const providerConfig = getProviderConfig();

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
            case 'Pets':
              iconName = focused ? 'paw' : 'paw-outline';
              break;
            case 'Listings':
              iconName = focused ? providerConfig.icon as any : `${providerConfig.icon}-outline` as any;
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

          // Special handling for provider icons that don't have outline variants
          if (route.name === 'Listings') {
            const baseIcon = providerConfig.icon;
            if (['medical', 'cut', 'storefront', 'heart'].includes(baseIcon)) {
              iconName = focused ? baseIcon as any : `${baseIcon}-outline` as any;
            }
          }

          const iconColor = route.name === 'Listings' && focused ? providerConfig.color : color;

          return (
            <View style={[
              focused ? styles.activeTab : undefined,
              route.name === 'Listings' && focused && { backgroundColor: `${providerConfig.color}15` }
            ]}>
              <Ionicons name={iconName} size={focused ? 26 : 24} color={iconColor} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -4,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[100],
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 10,
        },
      })}
    >
      <MainTab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <MainTab.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      {isProvider ? (
        <MainTab.Screen
          name="Listings"
          component={ProviderListingsScreen}
          options={{
            tabBarLabel: userRole === 'SUPPLIER' ? 'Shop' : 'Services',
            tabBarActiveTintColor: providerConfig.color,
          }}
        />
      ) : (
        <MainTab.Screen
          name="Pets"
          component={PetsScreen}
          options={{ tabBarLabel: 'Pets' }}
        />
      )}
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

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: `${colors.primary}15`,
    padding: 8,
    borderRadius: 12,
  },
});
