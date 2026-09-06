import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { likesApi, swipeApi } from '../lib/api';
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
  const [pets, setPets] = useState<Pet[]>([]);
  const [deckLoading, setDeckLoading] = useState(true);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const fetchedWithLocation = useRef(false);

  const normalizeProfile = (item: any): Pet | null => {
    const pet = item?.pet ?? item;
    const owner = item?.owner ?? pet?.owner ?? item?.user ?? {};
    const id = pet?.id ?? pet?._id ?? item?.id;
    if (id === undefined || id === null) return null;
    const photos = Array.isArray(pet?.photos) && pet.photos.length > 0
      ? pet.photos.map(String)
      : [item?.image ?? pet?.image ?? owner?.image ?? ''].filter(Boolean);
    return {
      id: String(id),
      name: String(pet?.name ?? 'Pet'),
      breed: String(pet?.breed ?? ''),
      age: String(pet?.age ?? ''),
      gender: String(pet?.gender ?? ''),
      photos,
      owner: {
        id: owner?.id ?? owner?._id ? String(owner.id ?? owner._id) : undefined,
        name: String(owner?.name ?? ''),
        location: String(owner?.location ?? owner?.city ?? ''),
        distance: typeof owner?.distance === 'string' ? owner.distance : undefined,
        latitude: typeof owner?.latitude === 'number' ? owner.latitude : undefined,
        longitude: typeof owner?.longitude === 'number' ? owner.longitude : undefined,
        verified: Boolean(owner?.verified ?? owner?.aadhaarVerified ?? false),
      },
      traits: Array.isArray(pet?.traits) ? pet.traits.map(String) : [],
      services: Array.isArray(pet?.services) ? pet.services.map(String)
        : Array.isArray(owner?.services) ? owner.services.map(String) : [],
      about: String(pet?.about ?? pet?.bio ?? item?.bio ?? ''),
    };
  };

  const loadDeck = useCallback(async (lat?: number, lng?: number) => {
    setDeckError(null);
    try {
      const data = await swipeApi.getProfiles(lat, lng);
      const list = data.profiles || data.pets || data.data || data || [];
      const cards = (Array.isArray(list) ? list : [])
        .map(normalizeProfile)
        .filter((p): p is Pet => p !== null);
      setPets(cards);
      setCurrentIndex(0);
      setCurrentPhotoIndex(0);
    } catch (error) {
      logger.error('Failed to load swipe deck:', error);
      setPets([]);
      setDeckError(error instanceof Error ? error.message : 'Could not load pets.');
    } finally {
      setDeckLoading(false);
    }
  }, []);

  // Initial deck (location may still be resolving — coordinates refine it).
  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  // Refetch once with real coordinates when the fix arrives.
  useEffect(() => {
    if (location && !fetchedWithLocation.current) {
      fetchedWithLocation.current = true;
      setDeckLoading(true);
      loadDeck(location.latitude, location.longitude);
    }
  }, [location, loadDeck]);

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
      // Send like to API — a match modal appears ONLY on a real mutual match.
      try {
        const targetId = pet.owner.id ?? pet.id;
        const response = await likesApi.sendLike(targetId, true);

        if (response?.match) {
          setMatchedPet(pet);
          setMatchConversationId(response.match.conversationId ?? null);
          setShowMatchModal(true);
        }
      } catch (error) {
        logger.log('Failed to send like');
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

  const reloadDeck = () => {
    setDeckLoading(true);
    loadDeck(location?.latitude, location?.longitude);
  };

  // Loading / error / exhausted states
  if (deckLoading || deckError || currentIndex >= pets.length || !currentPet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={deckError ? 'cloud-offline-outline' : 'paw'}
              size={60}
              color={colors.gray[300]}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {deckLoading ? 'Finding pets near you...' : deckError ? 'Could not load pets' : 'No more pets nearby'}
          </Text>
          <Text style={styles.emptyText}>
            {deckLoading
              ? 'Fetching new profiles...'
              : deckError ?? 'Check back later for new matches!'}
          </Text>
          {!deckLoading && (
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => {
                if (deckError) {
                  reloadDeck();
                } else {
                  setCurrentIndex(0);
                  setCurrentPhotoIndex(0);
                }
              }}
            >
              <Ionicons name="refresh" size={20} color={colors.white} />
              <Text style={styles.refreshBtnText}>{deckError ? 'Retry' : 'Start Over'}</Text>
            </TouchableOpacity>
          )}
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
