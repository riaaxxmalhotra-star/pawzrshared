import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

const roles = [
  {
    id: 'OWNER',
    title: 'Pet Owner',
    description: 'I have pets and want to find services, connect with other pet parents',
    icon: 'paw',
    color: colors.primary,
  },
  {
    id: 'LOVER',
    title: 'Pet Lover',
    description: 'I love pets! I want to walk dogs, pet-sit, and meet furry friends',
    icon: 'heart',
    color: '#EC4899',
  },
  {
    id: 'GROOMER',
    title: 'Pet Groomer',
    description: 'I provide professional grooming services for pets',
    icon: 'cut',
    color: '#8B5CF6',
  },
  {
    id: 'VET',
    title: 'Veterinarian',
    description: 'I provide medical care and health services for pets',
    icon: 'medical',
    color: '#10B981',
  },
  {
    id: 'SUPPLIER',
    title: 'Pet Supplier',
    description: 'I sell pet food, accessories, and supplies',
    icon: 'storefront',
    color: '#3B82F6',
  },
];

export default function RoleSelectionScreen() {
  const navigation = useNavigation<any>();
  const { updateUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await updateUserRole(selectedRole);
      // Navigate to role-specific onboarding
      navigation.replace('Onboarding', { role: selectedRole });
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Who are you?</Text>
          <Text style={styles.subtitle}>
            Select your role to personalize your experience
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.roleCardSelected,
                selectedRole === role.id && { borderColor: role.color },
              ]}
              onPress={() => setSelectedRole(role.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${role.color}15` },
                  selectedRole === role.id && { backgroundColor: `${role.color}25` },
                ]}
              >
                <Ionicons
                  name={role.icon as any}
                  size={32}
                  color={role.color}
                />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  selectedRole === role.id && { borderColor: role.color },
                ]}
              >
                {selectedRole === role.id && (
                  <View
                    style={[styles.radioInner, { backgroundColor: role.color }]}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    lineHeight: 22,
  },
  rolesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.gray[100],
  },
  roleCardSelected: {
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    backgroundColor: colors.background,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
