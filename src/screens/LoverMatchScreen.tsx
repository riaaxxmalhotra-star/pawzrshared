import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 24;
const CARD_HEIGHT = height * 0.72;
const SWIPE_THRESHOLD = 120;

interface PetLover {
  id: string;
  name: string;
  age: number;
  photos: string[];
  distance: string;
  rating: number;
  reviews: number;
  verified: boolean;
  bio: string;
  services: string[];
  experience: string;
  prompts?: { prompt: string; answer: string }[];
}

// Mock pet lovers data
const mockLovers: PetLover[] = [
  {
    id: '1',
    name: 'Priya',
    age: 25,
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    ],
    distance: '0.8 km',
    rating: 4.9,
    reviews: 47,
    verified: true,
    bio: 'Animal lover with 3 years experience caring for pets. Your furry friends are in safe hands!',
    services: ['Dog Walking', 'Pet Sitting', 'Day Care'],
    experience: 'Expert',
    prompts: [
      { prompt: 'My ideal Saturday with a pet involves...', answer: 'Long walks in the park followed by cuddle time!' },
      { prompt: 'The way to my heart is through...', answer: 'A wagging tail and wet nose kisses' },
    ],
  },
  {
    id: '2',
    name: 'Rahul',
    age: 28,
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    ],
    distance: '1.2 km',
    rating: 4.8,
    reviews: 32,
    verified: true,
    bio: 'Dog dad to 2 golden retrievers. I treat every pet like my own family member.',
    services: ['Day Care', 'Overnight Stay', 'Dog Walking'],
    experience: 'Expert',
    prompts: [
      { prompt: 'My hidden talent with animals is...', answer: 'I can calm any anxious pet within minutes!' },
    ],
  },
  {
    id: '3',
    name: 'Anita',
    age: 32,
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400',
    ],
    distance: '1.5 km',
    rating: 5.0,
    reviews: 89,
    verified: true,
    bio: 'Professional pet sitter certified in pet first aid. Specialized in senior pets and special needs.',
    services: ['Pet Sitting', 'Grooming', 'Medical Care'],
    experience: 'Professional',
    prompts: [
      { prompt: 'If I were a pet, I would be a...', answer: 'A loyal golden retriever - always happy to see you!' },
      { prompt: 'My pet care philosophy is...', answer: 'Every pet deserves love, patience, and the best care possible' },
    ],
  },
  {
    id: '4',
    name: 'Vikram',
    age: 24,
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    ],
    distance: '2.1 km',
    rating: 4.7,
    reviews: 21,
    verified: false,
    bio: 'Active runner looking to walk your dogs! Great with high-energy breeds.',
    services: ['Dog Walking', 'Pet Meetup', 'Training'],
    experience: 'Intermediate',
    prompts: [
      { prompt: 'The most spontaneous thing I have done for a pet...', answer: 'Drove 3 hours to rescue a stray!' },
    ],
  },
];

export default function LoverMatchScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [likedLovers, setLikedLovers] = useState<string[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedLover, setMatchedLover] = useState<PetLover | null>(null);

  const position = useRef(new Animated.ValueXY()).current;

  const rotation = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, width / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-width / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [1, 0.92, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.5 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -width - 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => nextCard());
  };

  const swipeRight = () => {
    const lover = mockLovers[currentIndex];
    setLikedLovers([...likedLovers, lover.id]);

    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // Random match for demo
      if (Math.random() > 0.5) {
        setMatchedLover(lover);
        setShowMatchModal(true);
      }
      nextCard();
    });
  };

  const nextCard = () => {
    setCurrentIndex((prev) => prev + 1);
    setCurrentPhotoIndex(0);
    position.setValue({ x: 0, y: 0 });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handlePhotoTap = (direction: 'left' | 'right') => {
    const lover = mockLovers[currentIndex];
    if (!lover) return;

    if (direction === 'right' && currentPhotoIndex < lover.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else if (direction === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const currentLover = mockLovers[currentIndex];
  const nextLover = mockLovers[currentIndex + 1];

  // Empty state
  if (currentIndex >= mockLovers.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart" size={60} color={colors.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>No more pet lovers nearby</Text>
          <Text style={styles.emptyText}>Check back later for new matches!</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              setCurrentIndex(0);
              setCurrentPhotoIndex(0);
            }}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.refreshBtnText}>Start Over</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Next Card (behind) */}
        {nextLover && (
          <Animated.View
            style={[
              styles.card,
              styles.nextCard,
              { transform: [{ scale: nextCardScale }] },
            ]}
          >
            <Image source={{ uri: nextLover.photos[0] }} style={styles.cardImage} />
          </Animated.View>
        )}

        {/* Current Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate: rotation },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Photo */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.photoContainer}
            onPress={(e) => {
              const touchX = e.nativeEvent.locationX;
              if (touchX < CARD_WIDTH / 2) {
                handlePhotoTap('left');
              } else {
                handlePhotoTap('right');
              }
            }}
          >
            <Image
              source={{ uri: currentLover.photos[currentPhotoIndex] }}
              style={styles.cardImage}
            />

            {/* Photo indicators */}
            {currentLover.photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {currentLover.photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.photoIndicator,
                      index === currentPhotoIndex && styles.photoIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
            >
              {/* Info Content */}
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{currentLover.name}, {currentLover.age}</Text>
                  {currentLover.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                  )}
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>{currentLover.distance}</Text>
                  <Ionicons name="star" size={14} color="#F59E0B" style={{ marginLeft: 12 }} />
                  <Text style={styles.metaText}>{currentLover.rating} ({currentLover.reviews})</Text>
                </View>

                <View style={styles.servicesRow}>
                  {currentLover.services.slice(0, 3).map((service) => (
                    <View key={service} style={styles.serviceBadge}>
                      <Text style={styles.serviceText}>{service}</Text>
                    </View>
                  ))}
                </View>

                {currentLover.prompts && currentLover.prompts[0] && (
                  <View style={styles.promptCard}>
                    <Text style={styles.promptQuestion}>{currentLover.prompts[0].prompt}</Text>
                    <Text style={styles.promptAnswer}>{currentLover.prompts[0].answer}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Like/Nope Stamps */}
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeText}>NOPE</Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionBtn, styles.nopeBtn]} onPress={swipeLeft}>
          <Ionicons name="close" size={32} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.superBtn]}>
          <Ionicons name="star" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={swipeRight}>
          <Ionicons name="heart" size={32} color="#EC4899" />
        </TouchableOpacity>
      </View>

      {/* Match Modal */}
      <Modal visible={showMatchModal} animationType="fade" transparent>
        <View style={styles.matchOverlay}>
          <View style={styles.matchContent}>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchedLover?.name} liked each other
            </Text>

            <View style={styles.matchImages}>
              <View style={styles.matchImageContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }}
                  style={styles.matchImage}
                />
              </View>
              <View style={styles.matchHeart}>
                <Ionicons name="heart" size={28} color="#EC4899" />
              </View>
              <View style={styles.matchImageContainer}>
                <Image
                  source={{ uri: matchedLover?.photos[0] }}
                  style={styles.matchImage}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.messageBtn}
              onPress={() => {
                setShowMatchModal(false);
                navigation.navigate('Messages');
              }}
            >
              <Text style={styles.messageBtnText}>Send Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.keepSwipingBtn}
              onPress={() => setShowMatchModal(false)}
            >
              <Text style={styles.keepSwipingText}>Keep Swiping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  nextCard: {
    opacity: 0.9,
  },
  photoContainer: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray[200],
  },
  photoIndicators: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
  },
  photoIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: colors.white,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  cardInfo: {
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 4,
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  servicesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  promptCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  promptQuestion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  promptAnswer: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    lineHeight: 20,
  },
  stamp: {
    position: 'absolute',
    top: 60,
    padding: 12,
    borderWidth: 4,
    borderRadius: 8,
    transform: [{ rotate: '-15deg' }],
  },
  likeStamp: {
    right: 30,
    borderColor: '#10B981',
  },
  nopeStamp: {
    left: 30,
    borderColor: '#EF4444',
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
  },
  nopeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EF4444',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 20,
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nopeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#EF444430',
  },
  superBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  likeBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#EC489930',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
    gap: 8,
  },
  refreshBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Match Modal
  matchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContent: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 32,
    width: width - 48,
    alignItems: 'center',
  },
  matchTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EC4899',
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  matchImages: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  matchImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#EC4899',
  },
  matchImage: {
    width: '100%',
    height: '100%',
  },
  matchHeart: {
    marginHorizontal: -12,
    zIndex: 1,
    backgroundColor: colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageBtn: {
    backgroundColor: '#EC4899',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  keepSwipingBtn: {
    paddingVertical: 12,
  },
  keepSwipingText: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
});
