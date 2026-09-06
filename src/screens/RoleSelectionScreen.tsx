import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import logger from '../lib/logger';

const { width } = Dimensions.get('window');

// Role-specific colors
const roleColors = {
  OWNER: '#F97316',    // Orange
  LOVER: '#F97316',    // Orange (same as Owner)
  VET: '#10B981',      // Green
  GROOMER: '#8B5CF6',  // Purple
  SUPPLIER: '#3B82F6', // Blue
  CAFE: '#14B8A6',     // Teal
};

const roles = [
  {
    id: 'OWNER',
    title: 'Pet Owner',
    subtitle: 'Find love for your pet',
    description: 'Connect with pet lovers, find playdates, and discover amazing care',
    icon: 'paw',
    emoji: '🐕',
    color: roleColors.OWNER,
  },
  {
    id: 'LOVER',
    title: 'Pet Lover',
    subtitle: 'Meet adorable pets',
    description: 'Swipe, match, and connect with pets for walks and cuddles',
    icon: 'heart',
    emoji: '💕',
    color: roleColors.LOVER,
  },
  {
    id: 'VET',
    title: 'Veterinarian',
    subtitle: 'Grow your practice',
    description: 'List your clinic, manage appointments, and reach pet owners',
    icon: 'medkit',
    emoji: '🏥',
    color: roleColors.VET,
  },
  {
    id: 'GROOMER',
    title: 'Pet Groomer',
    subtitle: 'Showcase your skills',
    description: 'List grooming services, manage bookings, and grow your business',
    icon: 'cut',
    emoji: '✂️',
    color: roleColors.GROOMER,
  },
  {
    id: 'SUPPLIER',
    title: 'Pet Supplier',
    subtitle: 'Sell pet products',
    description: 'List products, manage inventory, and reach pet owners nearby',
    icon: 'storefront',
    emoji: '🏪',
    color: roleColors.SUPPLIER,
  },
  {
    id: 'CAFE',
    title: 'Pet Cafe & Events',
    subtitle: 'Host pet-friendly experiences',
    description: 'Create events, manage bookings, and welcome pets & their owners',
    icon: 'cafe',
    emoji: '☕',
    color: roleColors.CAFE,
  },
];

export default function RoleSelectionScreen() {
  const navigation = useNavigation<any>();
  const { user, updateUserRole } = useAuth();
  // Pre-select the saved role so returning users see their choice, not a blank form.
  const [selectedRole, setSelectedRole] = useState<string | null>(user?.role ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await updateUserRole(selectedRole);
      navigation.replace('Onboarding', { role: selectedRole });
    } catch (error) {
      logger.error('Error updating role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>pawzr</Text>
        </View>
        <Text style={styles.title}>Join as</Text>
        <Text style={styles.subtitle}>Choose how you want to use Pawzr</Text>
      </View>

      {/* Role Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.card,
                isSelected && { borderColor: role.color, backgroundColor: `${role.color}08` },
              ]}
              onPress={() => setSelectedRole(role.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${role.color}15` }]}>
                <Text style={styles.emoji}>{role.emoji}</Text>
              </View>

              <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={[styles.cardSubtitle, { color: role.color }]}>{role.subtitle}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </View>

              {/* Selection indicator */}
              <View style={[
                styles.checkCircle,
                isSelected && { backgroundColor: role.color, borderColor: role.color },
              ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedRoleData && { backgroundColor: selectedRoleData.color },
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>
              {selectedRole ? `Continue as ${selectedRoleData?.title}` : 'Select a role'}
            </Text>
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
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logo: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray[500],
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  emoji: {
    fontSize: 28,
  },
  cardTextContent: {
    flex: 1,
    paddingRight: 30,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.gray[500],
    lineHeight: 16,
  },
  checkCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    backgroundColor: colors.background,
  },
  continueButton: {
    backgroundColor: colors.gray[300],
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
