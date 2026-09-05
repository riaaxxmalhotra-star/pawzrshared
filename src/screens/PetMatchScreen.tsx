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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { likesApi } from '../lib/api';
import { useLocation } from '../hooks/useLocation';
import { getDistanceString } from '../utils/distance';
import logger from '../lib/logger';
import { ActivityIndicator } from 'react-native';
import { isTablet, getCardDimensions } from '../utils/responsive';

const { width, height } = Dimensions.get('window');
// Use responsive card dimensions
const cardDims = getCardDimensions();
const CARD_WIDTH = cardDims.width;
const CARD_HEIGHT = cardDims.height;
const SWIPE_THRESHOLD = 120;

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: string;
  photos: string[];
  owner: {
    id?: string;
    name: string;
    location: string;
    distance?: string;
    latitude?: number;
    longitude?: number;
    verified: boolean;
  };
  traits: string[];
  services: string[];
  about: string;
}

// Mock pets data with up to 6 photos each
const mockPets: Pet[] = [
  {
    id: '1',
    name: 'Bruno',
    breed: 'Golden Retriever',
    age: '3 years',
    gender: 'Male',
    photos: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400',
      'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400',
      'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400',
      'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400',
    ],
    owner: {
      name: 'Rahul Kumar',
      location: 'Koramangala, Bangalore',
      distance: '1.2 km',
      verified: true,
    },
    traits: ['Friendly', 'Playful', 'Good with kids', 'Trained'],
    services: ['Dog Walking', 'Day Care'],
    about: 'Bruno is a friendly Golden Retriever who loves walks in the park!',
  },
  {
    id: '2',
    name: 'Whiskers',
    breed: 'Persian Cat',
    age: '2 years',
    gender: 'Female',
    photos: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400',
      'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
    ],
    owner: {
      name: 'Priya Sharma',
      location: 'Indiranagar, Bangalore',
      distance: '0.8 km',
      verified: true,
    },
    traits: ['Calm', 'Independent', 'Indoor', 'Cuddly'],
    services: ['Pet Sitting', 'Overnight Stay'],
    about: 'Whiskers is a calm Persian who loves cuddles.',
  },
  {
    id: '3',
    name: 'Max',
    breed: 'Labrador',
    age: '4 years',
    gender: 'Male',
    photos: [
      'https://images.unsplash.com/photo-1605897472359-85e4b94d685a?w=400',
      'https://images.unsplash.com/photo-1579213838942-6f6882e1c40b?w=400',
      'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=400',
      'https://images.unsplash.com/photo-1587559045816-8b0a54d12c73?w=400',
      'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=400',
    ],
    owner: {
      name: 'Amit Patel',
      location: 'HSR Layout, Bangalore',
      distance: '2.5 km',
      verified: false,
    },
    traits: ['Energetic', 'Loves swimming', 'Fetch lover', 'Social'],
    services: ['Dog Walking', 'Day Care', 'Pet Meetup'],
    about: 'Max is super energetic and loves outdoor activities!',
  },
  {
    id: '4',
    name: 'Coco',
    breed: 'Beagle',
    age: '1.5 years',
    gender: 'Female',
    photos: [
      'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=400',
      'https://images.unsplash.com/photo-1611003228941-98852ba62227?w=400',
      'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400',
    ],
    owner: {
      name: 'Neha Gupta',
      location: 'Whitefield, Bangalore',
      distance: '5 km',
      verified: true,
    },
    traits: ['Curious', 'Friendly', 'Good with dogs', 'Active'],
    services: ['Dog Walking', 'Overnight Stay'],
    about: 'Coco is a curious little beagle who loves exploring!',
  },
  {
    id: '5',
    name: 'Rocky',
    breed: 'German Shepherd',
    age: '5 years',
    gender: 'Male',
    photos: [
      'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400',
      'https://images.unsplash.com/photo-1568572933382-74d440642117?w=400',
      'https://images.unsplash.com/photo-1553882809-a4f57e59501d?w=400',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
    ],
    owner: {
      name: 'Vikram Singh',
      location: 'JP Nagar, Bangalore',
      distance: '3.2 km',
      verified: true,
    },
    traits: ['Loyal', 'Protective', 'Well-trained', 'Intelligent'],
    services: ['Day Care', 'Pet Sitting'],
    about: 'Rocky is a loyal and well-trained German Shepherd.',
  },
];

export default function PetMatchScreen() {
  const navigation = useNavigation<any>();
  const { location } = useLocation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [likedPets, setLikedPets] = useState<string[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedPet, setMatchedPet] = useState<Pet | null>(null);
  const [matchConversationId, setMatchConversationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pets, setPets] = useState<Pet[]>(mockPets);
  const [startingChat, setStartingChat] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;

  // Helper function to get distance string for a pet owner
  const getPetDistance = (pet: Pet): string => {
    if (pet.owner.latitude && pet.owner.longitude && location) {
      return getDistanceString(
        location.latitude,
        location.longitude,
        pet.owner.latitude,
        pet.owner.longitude
      );
    }
    return pet.owner.distance || 'Distance unknown';
  };

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
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Only capture horizontal swipes (not vertical scrolls or taps)
        return Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        // Capture the gesture if it's clearly a horizontal swipe
        return Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy * 1.5);
      },
      onPanResponderGrant: () => {
        // Reset position when gesture starts
        position.setOffset({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.5 });
      },
      onPanResponderRelease: (_, gesture) => {
        position.flattenOffset();
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

  const swipeLeft = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const pet = pets[currentIndex];

    Animated.timing(position, {
      toValue: { x: -width - 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(async () => {
      // Send pass to API (use owner id if available)
      try {
        if (pet.owner.id) {
          await likesApi.sendLike(pet.owner.id, false);
        }
      } catch (error) {
        logger.log('Failed to send pass');
      }
      nextCard();
      setIsProcessing(false);
    });
  };

  const swipeRight = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const pet = pets[currentIndex];
    setLikedPets([...likedPets, pet.id]);

    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(async () => {
      // Send like to API
      try {
        if (pet.owner.id) {
          const response = await likesApi.sendLike(pet.owner.id, true);

          // Check if it's a match
          if (response.match) {
            setMatchedPet(pet);
            setMatchConversationId(response.match.conversationId);
            setShowMatchModal(true);
          }
        } else {
          // Fallback to random match for demo when no owner id
          if (Math.random() > 0.5) {
            setMatchedPet(pet);
            setShowMatchModal(true);
          }
        }
      } catch (error) {
        logger.log('Failed to send like');
        // Fallback to random match for demo
        if (Math.random() > 0.5) {
          setMatchedPet(pet);
          setShowMatchModal(true);
        }
      }
      nextCard();
      setIsProcessing(false);
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
    const pet = pets[currentIndex];
    if (!pet) return;

    if (direction === 'right' && currentPhotoIndex < pet.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else if (direction === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const currentPet = pets[currentIndex];
  const nextPet = pets[currentIndex + 1];

  // Empty state - check both index AND if currentPet exists
  if (currentIndex >= pets.length || !currentPet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="paw" size={60} color={colors.gray[300]} />
          </View>
          <Text style={styles.emptyTitle}>No more pets nearby</Text>
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
        {nextPet && (
          <Animated.View
            style={[
              styles.card,
              styles.nextCard,
              { transform: [{ scale: nextCardScale }] },
            ]}
          >
            <Image source={{ uri: nextPet.photos[0] }} style={styles.cardImage} />
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
              source={{ uri: currentPet.photos[currentPhotoIndex] }}
              style={styles.cardImage}
            />

            {/* Photo indicators */}
            {currentPet.photos.length > 1 && (
              <View style={styles.photoIndicators}>
                {currentPet.photos.map((_, index) => (
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

            {/* Gradient Overlay with Info */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.gradientOverlay}
            >
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.petName}>{currentPet.name}</Text>
                  {currentPet.owner.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                  )}
                </View>

                <Text style={styles.petBreed}>{currentPet.breed} • {currentPet.age}</Text>

                <View style={styles.metaRow}>
                  <Ionicons name="person" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.metaText}>{currentPet.owner.name}</Text>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 12 }} />
                  <Text style={styles.metaText}>{getPetDistance(currentPet)}</Text>
                </View>

                <View style={styles.traitsRow}>
                  {currentPet.traits.slice(0, 3).map((trait) => (
                    <View key={trait} style={styles.traitBadge}>
                      <Text style={styles.traitText}>{trait}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.servicesRow}>
                  <Text style={styles.servicesLabel}>Looking for:</Text>
                  {currentPet.services.slice(0, 2).map((service) => (
                    <View key={service} style={styles.serviceBadge}>
                      <Text style={styles.serviceText}>{service}</Text>
                    </View>
                  ))}
                </View>
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
        <TouchableOpacity
          style={[styles.actionBtn, styles.nopeBtn]}
          onPress={() => !isProcessing && swipeLeft()}
          disabled={isProcessing}
        >
          <Ionicons name="close" size={32} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.likeBtn]}
          onPress={() => !isProcessing && swipeRight()}
          disabled={isProcessing}
        >
          <Ionicons name="heart" size={32} color="#F97316" />
        </TouchableOpacity>
      </View>

      {/* Match Modal */}
      <Modal visible={showMatchModal} animationType="fade" transparent>
        <View style={styles.matchOverlay}>
          <View style={styles.matchContent}>
            <Text style={styles.matchTitle}>It's a Match!</Text>
            <Text style={styles.matchSubtitle}>
              You and {matchedPet?.owner.name} both liked each other
            </Text>

            <View style={styles.matchImages}>
              <View style={styles.matchImageContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }}
                  style={styles.matchImage}
                />
              </View>
              <View style={styles.matchHeart}>
                <Ionicons name="heart" size={28} color="#F97316" />
              </View>
              <View style={styles.matchImageContainer}>
                <Image
                  source={{ uri: matchedPet?.photos[0] }}
                  style={styles.matchImage}
                />
              </View>
            </View>

            <Text style={styles.petMatchName}>{matchedPet?.name}</Text>

            <TouchableOpacity
              style={[styles.messageBtn, startingChat && styles.messageBtnDisabled]}
              disabled={startingChat}
              onPress={() => {
                if (!matchedPet?.owner?.id || startingChat) {
                  return;
                }

                setStartingChat(true);

                // Prepare navigation params
                const chatParams = {
                  conversationId: matchConversationId || `new-${matchedPet.owner.id}`,
                  matchedUser: {
                    id: matchedPet.owner.id,
                    name: matchedPet.owner.name || matchedPet.name,
                    type: 'owner' as const,
                    photo: matchedPet.photos?.[0],
                    online: true,
                    verified: matchedPet.owner.verified || false,
                  },
                  petName: matchedPet.name,
                  petId: matchedPet.id,
                };

                // Close modal and navigate
                setShowMatchModal(false);

                // Navigate after a short delay to let modal close
                setTimeout(() => {
                  setStartingChat(false);
                  navigation.navigate('Chat', chatParams);
                }, 200);
              }}
            >
              {startingChat ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.messageBtnText}>Send Message</Text>
              )}
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
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  petName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 4,
    borderRadius: 12,
  },
  petBreed: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  traitsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  traitBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  traitText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  servicesLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  serviceBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
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
    borderColor: '#F9731630',
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
    color: '#F97316',
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
    marginBottom: 16,
  },
  matchImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#F97316',
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
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  petMatchName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 24,
  },
  messageBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageBtnDisabled: {
    opacity: 0.7,
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
