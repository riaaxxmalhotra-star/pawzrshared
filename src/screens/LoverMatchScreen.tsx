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
  ActivityIndicator,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { likesApi, swipeApi } from '../lib/api';
import { useLocation } from '../hooks/useLocation';
import logger from '../lib/logger';
import { getDistanceString } from '../utils/distance';
import { getCardDimensions } from '../utils/responsive';

// Confetti configuration
const CONFETTI_COUNT = 50;
const CONFETTI_COLORS = ['#F97316', '#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];

const { width, height } = Dimensions.get('window');
// Use responsive card dimensions
const cardDims = getCardDimensions();
const CARD_WIDTH = cardDims.width;
const CARD_HEIGHT = cardDims.height;
const SWIPE_THRESHOLD = 120;

interface PetLover {
  id: string;
  name: string;
  age: number;
  photos: string[];
  distance?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviews: number;
  verified: boolean;
  bio: string;
  services: string[];
  experience: string;
  prompts?: { prompt: string; answer: string }[];
}

// Confetti Particle Component
interface ConfettiParticle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

const createConfettiParticles = (): ConfettiParticle[] => {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(-20),
    rotation: new Animated.Value(0),
    scale: new Animated.Value(1),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: Math.random() * 10 + 6,
  }));
};

const ConfettiView = ({ particles, visible }: { particles: ConfettiParticle[]; visible: boolean }) => {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confettiPiece,
            {
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size * 0.6,
              borderRadius: particle.size * 0.1,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                {
                  rotate: particle.rotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
                { scale: particle.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

export default function LoverMatchScreen() {
  const navigation = useNavigation<any>();
  const { location } = useLocation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [likedLovers, setLikedLovers] = useState<string[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedLover, setMatchedLover] = useState<PetLover | null>(null);
  const [matchConversationId, setMatchConversationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lovers, setLovers] = useState<PetLover[]>([]);
  const [deckLoading, setDeckLoading] = useState(true);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const fetchedWithLocation = useRef(false);

  const normalizeProfile = (item: any): PetLover | null => {
    const lover = item?.lover ?? item?.user ?? item;
    const id = lover?.id ?? lover?._id ?? item?.id;
    if (id === undefined || id === null) return null;
    const photos = Array.isArray(lover?.photos) && lover.photos.length > 0
      ? lover.photos.map(String)
      : [lover?.image ?? lover?.photo ?? ''].filter(Boolean);
    return {
      id: String(id),
      name: String(lover?.name ?? 'Pet Lover'),
      age: Number(lover?.age ?? 0),
      photos,
      distance: typeof lover?.distance === 'string' ? lover.distance : undefined,
      latitude: typeof lover?.latitude === 'number' ? lover.latitude
        : typeof lover?.location?.lat === 'number' ? lover.location.lat : undefined,
      longitude: typeof lover?.longitude === 'number' ? lover.longitude
        : typeof lover?.location?.lng === 'number' ? lover.location.lng : undefined,
      rating: Number(lover?.rating ?? lover?.averageRating ?? 0),
      reviews: Number(lover?.reviews ?? lover?.reviewCount ?? 0),
      verified: Boolean(lover?.verified ?? lover?.aadhaarVerified ?? false),
      bio: String(lover?.bio ?? lover?.about ?? ''),
      services: Array.isArray(lover?.services) ? lover.services.map(String) : [],
      experience: String(lover?.experience ?? ''),
      prompts: Array.isArray(lover?.prompts)
        ? lover.prompts.map((p: any) => ({ prompt: String(p.prompt ?? ''), answer: String(p.answer ?? '') }))
        : undefined,
    };
  };

  const loadDeck = useCallback(async (lat?: number, lng?: number) => {
    setDeckError(null);
    try {
      const data = await swipeApi.getProfiles(lat, lng);
      const list = data.profiles || data.lovers || data.data || data || [];
      const cards = (Array.isArray(list) ? list : [])
        .map(normalizeProfile)
        .filter((l): l is PetLover => l !== null);
      setLovers(cards);
      setCurrentIndex(0);
      setCurrentPhotoIndex(0);
    } catch (error) {
      logger.error('Failed to load swipe deck:', error);
      setLovers([]);
      setDeckError(error instanceof Error ? error.message : 'Could not load profiles.');
    } finally {
      setDeckLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  useEffect(() => {
    if (location && !fetchedWithLocation.current) {
      fetchedWithLocation.current = true;
      setDeckLoading(true);
      loadDeck(location.latitude, location.longitude);
    }
  }, [location, loadDeck]);


  // Match modal animation values
  const [confettiParticles] = useState<ConfettiParticle[]>(() => createConfettiParticles());
  const [showConfetti, setShowConfetti] = useState(false);
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const leftPhotoScale = useRef(new Animated.Value(0)).current;
  const rightPhotoScale = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  const position = useRef(new Animated.ValueXY()).current;

  // Helper function to get distance string for a lover
  const getLoverDistance = (lover: PetLover): string => {
    if (lover.latitude && lover.longitude && location) {
      return getDistanceString(
        location.latitude,
        location.longitude,
        lover.latitude,
        lover.longitude
      );
    }
    return lover.distance || 'Distance unknown';
  };

  // Start confetti animation
  const startConfettiAnimation = useCallback(() => {
    confettiParticles.forEach((particle) => {
      // Reset positions with random starting X
      const startX = Math.random() * width;
      particle.x.setValue(startX);
      particle.y.setValue(-20);
      particle.rotation.setValue(0);
      particle.scale.setValue(1);

      // Random destination based on starting position
      const destX = startX + (Math.random() - 0.5) * 200;
      const destY = height + 100;
      const duration = 2500 + Math.random() * 1500;

      Animated.parallel([
        Animated.timing(particle.y, {
          toValue: destY,
          duration,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(particle.x, {
          toValue: destX,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: Math.random() * 4 + 2,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 1.2,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [confettiParticles]);

  // Start heart pulse animation
  const startHeartPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.3,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();
  }, [heartPulse]);

  // Match modal entrance animation
  const startMatchAnimation = useCallback(() => {
    // Reset all values
    modalScale.setValue(0);
    modalOpacity.setValue(0);
    titleScale.setValue(0);
    leftPhotoScale.setValue(0);
    rightPhotoScale.setValue(0);
    buttonsOpacity.setValue(0);

    // Start confetti
    setShowConfetti(true);
    startConfettiAnimation();

    // Modal entrance
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered animations for content
    setTimeout(() => {
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }, 150);

    setTimeout(() => {
      Animated.spring(leftPhotoScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }, 300);

    setTimeout(() => {
      startHeartPulse();
    }, 400);

    setTimeout(() => {
      Animated.spring(rightPhotoScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }, 450);

    setTimeout(() => {
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 600);
  }, [modalScale, modalOpacity, titleScale, leftPhotoScale, rightPhotoScale, buttonsOpacity, startConfettiAnimation, startHeartPulse]);

  // Trigger animation when modal shows
  useEffect(() => {
    if (showMatchModal && matchedLover) {
      startMatchAnimation();
    } else {
      setShowConfetti(false);
    }
  }, [showMatchModal, matchedLover, startMatchAnimation]);

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

    const lover = lovers[currentIndex];

    Animated.timing(position, {
      toValue: { x: -width - 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(async () => {
      // Send pass to API
      try {
        await likesApi.sendLike(lover.id, false);
      } catch (error) {
        logger.log('Failed to send pass:', error);
      }
      nextCard();
      setIsProcessing(false);
    });
  };

  const swipeRight = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lover = lovers[currentIndex];
    setLikedLovers([...likedLovers, lover.id]);

    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(async () => {
      // Send like to API — a match modal appears ONLY on a real mutual match.
      try {
        const response = await likesApi.sendLike(lover.id, true);

        if (response?.match) {
          setMatchedLover(lover);
          setMatchConversationId(response.match.conversationId ?? null);
          setShowMatchModal(true);
        }
      } catch (error) {
        logger.log('Failed to send like:', error);
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
    const lover = lovers[currentIndex];
    if (!lover) return;

    if (direction === 'right' && currentPhotoIndex < lover.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else if (direction === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const currentLover = lovers[currentIndex];
  const nextLover = lovers[currentIndex + 1];

  const reloadDeck = () => {
    setDeckLoading(true);
    loadDeck(location?.latitude, location?.longitude);
  };

  // Loading / error / exhausted states
  if (deckLoading || deckError || currentIndex >= lovers.length || !currentLover) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={deckError ? 'cloud-offline-outline' : 'heart'}
              size={60}
              color={colors.gray[300]}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {deckLoading ? 'Finding pet lovers...' : deckError ? 'Could not load profiles' : 'No more pet lovers nearby'}
          </Text>
          <Text style={styles.emptyText}>
            {deckLoading ? 'Fetching new profiles...' : deckError ?? 'Check back later for new matches!'}
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
                  <Text style={styles.metaText}>{getLoverDistance(currentLover)}</Text>
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

      {/* Bumble-Style Match Modal with Confetti */}
      <Modal visible={showMatchModal} animationType="none" transparent>
        <Animated.View style={[styles.matchOverlay, { opacity: modalOpacity }]}>
          {/* Confetti Animation */}
          <ConfettiView particles={confettiParticles} visible={showConfetti} />

          <Animated.View
            style={[
              styles.matchContent,
              {
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              }
            ]}
          >
            {/* Animated Title */}
            <Animated.View style={{ transform: [{ scale: titleScale }] }}>
              <Text style={styles.matchTitle}>It's a Match!</Text>
              <View style={styles.matchTitleEmoji}>
                <Text style={styles.emojiText}>🎉</Text>
              </View>
            </Animated.View>

            <Animated.Text style={[styles.matchSubtitle, { opacity: titleScale }]}>
              You and {matchedLover?.name} liked each other
            </Animated.Text>

            {/* Animated Profile Photos */}
            <View style={styles.matchImages}>
              <Animated.View
                style={[
                  styles.matchImageContainer,
                  { transform: [{ scale: leftPhotoScale }] }
                ]}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }}
                  style={styles.matchImage}
                />
              </Animated.View>

              {/* Pulsing Heart */}
              <Animated.View
                style={[
                  styles.matchHeart,
                  { transform: [{ scale: heartPulse }] }
                ]}
              >
                <Ionicons name="heart" size={28} color="#F97316" />
              </Animated.View>

              <Animated.View
                style={[
                  styles.matchImageContainer,
                  { transform: [{ scale: rightPhotoScale }] }
                ]}
              >
                <Image
                  source={{ uri: matchedLover?.photos[0] }}
                  style={styles.matchImage}
                />
              </Animated.View>
            </View>

            {/* Animated Buttons */}
            <Animated.View style={[styles.matchButtons, { opacity: buttonsOpacity }]}>
              <TouchableOpacity
                style={[styles.messageBtn, startingChat && styles.messageBtnDisabled]}
                disabled={startingChat}
                onPress={async () => {
                  if (!matchedLover || startingChat) {
                    return;
                  }

                  setStartingChat(true);

                  // Prepare navigation params
                  const chatParams = {
                    conversationId: matchConversationId || `new-${matchedLover.id}`,
                    matchedUser: {
                      id: matchedLover.id,
                      name: matchedLover.name,
                      type: 'lover' as const,
                      photo: matchedLover.photos?.[0],
                      online: true,
                      verified: matchedLover.verified,
                    },
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
                  <>
                    <Ionicons name="chatbubble" size={20} color={colors.white} style={{ marginRight: 8 }} />
                    <Text style={styles.messageBtnText}>Send Message</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.keepSwipingBtn}
                onPress={() => setShowMatchModal(false)}
              >
                <Text style={styles.keepSwipingText}>Keep Swiping</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
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
    marginBottom: 24,
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
  messageBtn: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  // Confetti styles
  confettiPiece: {
    position: 'absolute',
  },
  // Enhanced match modal styles
  matchTitleEmoji: {
    position: 'absolute',
    top: -10,
    right: -30,
  },
  emojiText: {
    fontSize: 28,
  },
  matchButtons: {
    width: '100%',
    alignItems: 'center',
  },
});
