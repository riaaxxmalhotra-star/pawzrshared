import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PetOwnerOnboardingScreen from './PetOwnerOnboardingScreen';
import PetLoverOnboardingScreen from './PetLoverOnboardingScreen';
import GroomerOnboardingScreen from './GroomerOnboardingScreen';
import VetOnboardingScreen from './VetOnboardingScreen';
import SupplierOnboardingScreen from './SupplierOnboardingScreen';
import CafeOnboardingScreen from './CafeOnboardingScreen';
import AadhaarVerificationScreen from '../AadhaarVerificationScreen';
import { useAuth } from '../../lib/auth';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator({ route }: { route: any }) {
  // Cold restarts land here without params — seed from the saved role instead
  // of silently defaulting every returning user to the OWNER form.
  const { user } = useAuth();
  const role = route?.params?.role || user?.role || 'OWNER';

  const getScreen = () => {
    switch (role) {
      case 'OWNER':
        return PetOwnerOnboardingScreen;
      case 'LOVER':
        return PetLoverOnboardingScreen;
      case 'GROOMER':
        return GroomerOnboardingScreen;
      case 'VET':
        return VetOnboardingScreen;
      case 'SUPPLIER':
        return SupplierOnboardingScreen;
      case 'CAFE':
        return CafeOnboardingScreen;
      default:
        return PetOwnerOnboardingScreen;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingForm" component={getScreen()} />
      <Stack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen} />
    </Stack.Navigator>
  );
}
