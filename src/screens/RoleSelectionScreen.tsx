import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const roles = [
  {
    id: 'OWNER',
    title: 'Pet Owner',
    subtitle: 'Find love for your pet',
    description: 'Connect with pet lovers, find playdates, and discover amazing care for your furry friend',
    icon: 'paw',
    emoji: '🐕',
  },
  {
    id: 'LOVER',
    title: 'Pet Lover',
    subtitle: 'Meet adorable pets',
    description: 'Swipe, match, and connect with pets looking for walks, playtime, and cuddles',
    icon: 'heart',
    emoji: '💕',
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
      navigation.replace('Onboarding', { role: selectedRole });
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>pawzr</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>How do you want{'\n'}to use Pawzr?</Text>
        </View>

        {/* Role Cards - Bumble Style */}
        <View style={styles.cardsContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.card,
                selectedRole === role.id && styles.cardSelected,
              ]}
              onPress={() => setSelectedRole(role.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <Text style={styles.emoji}>{role.emoji}</Text>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardSubtitle}>{role.subtitle}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </View>

              {/* Selection indicator */}
              <View style={[
                styles.checkCircle,
                selectedRole === role.id && styles.checkCircleSelected,
              ]}>
                {selectedRole === role.id && (
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  logo: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray[900],
    textAlign: 'center',
    lineHeight: 36,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 3,
    borderColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7ED',
  },
  cardContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gray[900],
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  checkCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 30,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: colors.gray[300],
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
});
