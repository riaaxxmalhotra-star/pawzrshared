import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PetOwnerOnboardingScreen from './PetOwnerOnboardingScreen';
import PetLoverOnboardingScreen from './PetLoverOnboardingScreen';
import GroomerOnboardingScreen from './GroomerOnboardingScreen';
import VetOnboardingScreen from './VetOnboardingScreen';
import SupplierOnboardingScreen from './SupplierOnboardingScreen';
import AadhaarVerificationScreen from '../AadhaarVerificationScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator({ route }: { route: any }) {
  const role = route?.params?.role || 'OWNER';

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
