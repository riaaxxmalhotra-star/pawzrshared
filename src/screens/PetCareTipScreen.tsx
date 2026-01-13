import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';

interface TipContent {
  title: string;
  icon: string;
  color: string;
  image: string;
  intro: string;
  tips: { title: string; description: string }[];
  warning?: string;
}

const tipData: Record<string, TipContent> = {
  hydration: {
    title: 'Hydration Tips',
    icon: 'water',
    color: '#3B82F6',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
    intro: 'Proper hydration is essential for your pet\'s health. Dogs and cats need fresh, clean water available at all times to maintain healthy body functions.',
    tips: [
      {
        title: 'Fresh Water Daily',
        description: 'Change your pet\'s water bowl at least once daily. Clean the bowl regularly to prevent bacteria buildup.',
      },
      {
        title: 'Monitor Intake',
        description: 'Dogs typically need 1 ounce of water per pound of body weight daily. Cats need about 4 ounces per 5 pounds.',
      },
      {
        title: 'Multiple Water Stations',
        description: 'Place water bowls in different areas of your home so your pet always has easy access to hydration.',
      },
      {
        title: 'Wet Food Benefits',
        description: 'Wet food contains up to 80% moisture and can help supplement your pet\'s water intake, especially for cats.',
      },
      {
        title: 'Signs of Dehydration',
        description: 'Watch for dry gums, sunken eyes, lethargy, and loss of skin elasticity. Consult a vet if you notice these signs.',
      },
      {
        title: 'Exercise Hydration',
        description: 'Always bring water during walks or outdoor activities. Let your pet drink small amounts frequently rather than large amounts at once.',
      },
    ],
    warning: 'If your pet is drinking excessively or refusing water, consult your veterinarian as it could indicate underlying health issues.',
  },
  exercise: {
    title: 'Exercise Guide',
    icon: 'fitness',
    color: '#10B981',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
    intro: 'Regular exercise keeps your pet physically fit and mentally stimulated. The right amount of activity varies by breed, age, and health condition.',
    tips: [
      {
        title: 'Daily Walks',
        description: 'Most dogs need 30-60 minutes of walking daily. Small breeds may need less, while high-energy breeds may need more.',
      },
      {
        title: 'Play Sessions',
        description: 'Interactive games like fetch, tug-of-war, and chase provide both physical exercise and mental engagement.',
      },
      {
        title: 'Cat Play Activities',
        description: 'Use feather wands, laser pointers, and interactive toys. Aim for 15-20 minutes of active play 2-3 times daily for cats.',
      },
      {
        title: 'Swimming',
        description: 'Great low-impact exercise for dogs, especially those with joint issues. Always supervise and ensure your pet is comfortable in water.',
      },
      {
        title: 'Mental Stimulation',
        description: 'Puzzle toys, training sessions, and scent games exercise your pet\'s mind. Mental exercise is as important as physical activity.',
      },
      {
        title: 'Rest Days',
        description: 'Allow recovery time between intense activities. Puppies and senior pets especially need adequate rest between exercise sessions.',
      },
    ],
    warning: 'Avoid exercise during extreme heat. Watch for signs of exhaustion like excessive panting, drooling, or reluctance to continue.',
  },
  nutrition: {
    title: 'Nutrition Guide',
    icon: 'nutrition',
    color: '#F59E0B',
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400',
    intro: 'A balanced diet is the foundation of your pet\'s health. Quality nutrition supports their immune system, energy levels, and overall well-being.',
    tips: [
      {
        title: 'Safe Vegetables',
        description: 'Carrots, green beans, cucumbers, and pumpkin are great for dogs. Always introduce new foods gradually and in moderation.',
      },
      {
        title: 'Safe Fruits',
        description: 'Apples (no seeds), blueberries, watermelon (no seeds), and bananas are healthy treats. Avoid grapes, raisins, and citrus.',
      },
      {
        title: 'Protein Balance',
        description: 'High-quality animal protein should be the primary ingredient in your pet\'s food. Look for named meat sources on labels.',
      },
      {
        title: 'Portion Control',
        description: 'Follow feeding guidelines based on your pet\'s weight and activity level. Obesity is a leading health problem in pets.',
      },
      {
        title: 'Avoid Toxic Foods',
        description: 'Never feed chocolate, onions, garlic, xylitol, alcohol, caffeine, or macadamia nuts to pets - these are toxic.',
      },
      {
        title: 'Consistent Schedule',
        description: 'Feed at the same times daily. Most adult dogs do well with 2 meals per day, while cats may prefer smaller, more frequent meals.',
      },
    ],
    warning: 'Always consult your veterinarian before making significant changes to your pet\'s diet, especially if they have health conditions.',
  },
};

export default function PetCareTipScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tipType = route.params?.type || 'hydration';
  const content = tipData[tipType];

  if (!content) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Tip not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: content.image }} style={styles.heroImage} />
          <View style={[styles.heroOverlay, { backgroundColor: `${content.color}90` }]}>
            <View style={styles.heroIcon}>
              <Ionicons name={content.icon as any} size={32} color={colors.white} />
            </View>
            <Text style={styles.heroTitle}>{content.title}</Text>
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.introText}>{content.intro}</Text>
        </View>

        {/* Tips List */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Key Tips</Text>
          {content.tips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <View style={[styles.tipNumber, { backgroundColor: `${content.color}20` }]}>
                <Text style={[styles.tipNumberText, { color: content.color }]}>{index + 1}</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Warning */}
        {content.warning && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#D97706" />
            <Text style={styles.warningText}>{content.warning}</Text>
          </View>
        )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  heroContainer: {
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  section: {
    padding: 20,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[700],
  },
  tipsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[600],
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'flex-start',
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#92400E',
  },
});
