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
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = height * 0.6;
const SWIPE_THRESHOLD = 120;

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender: string;
  photos: string[];
  owner: {
    name: string;
    location: string;
    distance: string;
    verified: boolean;
  };
  traits: string[];
  services: string[];
  about: string;
}

// Mock pets data - now with up to 6 photos each
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
    about: 'Bruno is a friendly Golden Retriever who loves walks in the park. He\'s great with other dogs and kids!',
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
    about: 'Whiskers is a calm and independent Persian who loves cuddles. She needs someone patient and gentle.',
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
    about: 'Max is super energetic and loves outdoor activities. Perfect for active pet lovers!',
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
    about: 'Coco is a curious little beagle who loves exploring. She\'s great with other dogs!',
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
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=400',
    ],
    owner: {
      name: 'Vikram Singh',
      location: 'JP Nagar, Bangalore',
      distance: '3.2 km',
      verified: true,
    },
    traits: ['Loyal', 'Protective', 'Well-trained', 'Intelligent'],
    services: ['Day Care', 'Pet Sitting'],
    about: 'Rocky is a loyal and well-trained German Shepherd. Needs an experienced handler.',
  },
];

export default function PetMatchScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedPet, setMatchedPet] = useState<Pet | null>(null);
  const [likedPets, setLikedPets] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
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
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
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
    }).start(() => {
      nextCard();
    });
  };

  const swipeRight = () => {
    const pet = mockPets[currentIndex];
    setLikedPets([...likedPets, pet.id]);

    Animated.timing(position, {
      toValue: { x: width + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // Show match (for demo, show match randomly)
      if (Math.random() > 0.5) {
        setMatchedPet(pet);
        setShowMatchModal(true);
      }
      nextCard();
    });
  };

  const nextCard = () => {
    setCurrentIndex((prevIndex) => prevIndex + 1);
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
    const pet = mockPets[currentIndex];
    if (!pet) return;

    if (direction === 'right' && currentPhotoIndex < pet.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else if (direction === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const currentPet = mockPets[currentIndex];
  const nextPet = mockPets[currentIndex + 1];

  if (currentIndex >= mockPets.length) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Pets</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="options" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="paw" size={80} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>No more pets nearby</Text>
          <Text style={styles.emptyText}>Check back later for new pet matches!</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              setCurrentIndex(0);
              setCurrentPhotoIndex(0);
            }}
          >
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Pets</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Messages')}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.gray[700]} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{likedPets.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="options-outline" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
        </View>
      </View>

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
            <Image
              source={{ uri: nextPet.photos[0] }}
              style={styles.cardImage}
            />
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

            {/* Like/Nope Labels */}
            <Animated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={styles.likeText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Text style={styles.nopeText}>NOPE</Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Pet Info */}
          <View style={styles.cardInfo}>
            <View style={styles.petHeader}>
              <View>
                <Text style={styles.petName}>{currentPet.name}</Text>
                <Text style={styles.petBreed}>{currentPet.breed} • {currentPet.age}</Text>
              </View>
              {currentPet.owner.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            <View style={styles.ownerInfo}>
              <Ionicons name="person-circle-outline" size={20} color={colors.gray[500]} />
              <Text style={styles.ownerText}>{currentPet.owner.name}</Text>
              <Text style={styles.locationDot}>•</Text>
              <Ionicons name="location-outline" size={16} color={colors.gray[400]} />
              <Text style={styles.distanceText}>{currentPet.owner.distance}</Text>
            </View>

            <View style={styles.traitsContainer}>
              {currentPet.traits.slice(0, 4).map((trait) => (
                <View key={trait} style={styles.traitBadge}>
                  <Text style={styles.traitText}>{trait}</Text>
                </View>
              ))}
            </View>

            <View style={styles.servicesContainer}>
              <Text style={styles.servicesLabel}>Looking for:</Text>
              {currentPet.services.map((service) => (
                <View key={service} style={styles.serviceBadge}>
                  <Text style={styles.serviceText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionBtn, styles.rewindBtn]}>
          <Ionicons name="refresh" size={28} color="#F59E0B" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.nopeBtn]} onPress={swipeLeft}>
          <Ionicons name="close" size={36} color="#EF4444" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.superLikeBtn]}>
          <Ionicons name="star" size={28} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={swipeRight}>
          <Ionicons name="heart" size={36} color="#EC4899" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.boostBtn]}>
          <Ionicons name="flash" size={28} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Match Modal */}
      <Modal visible={showMatchModal} animationType="fade" transparent>
        <View style={styles.matchOverlay}>
          <View style={styles.matchContent}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchTitle}>It's a Match!</Text>
              <Text style={styles.matchSubtitle}>
                You and {matchedPet?.owner.name} both liked each other
              </Text>
            </View>

            <View style={styles.matchImages}>
              <View style={styles.matchImageContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }}
                  style={styles.matchImage}
                />
              </View>
              <View style={styles.matchHeart}>
                <Ionicons name="heart" size={32} color="#EC4899" />
              </View>
              <View style={styles.matchImageContainer}>
                <Image
                  source={{ uri: matchedPet?.photos[0] }}
                  style={styles.matchImage}
                />
              </View>
            </View>

            <Text style={styles.petMatchName}>{matchedPet?.name}</Text>

            <View style={styles.matchActions}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EC4899',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'absolute',
  },
  nextCard: {
    opacity: 0.8,
  },
  photoContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
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
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: colors.white,
  },
  stampContainer: {
    position: 'absolute',
    top: 50,
    padding: 10,
    borderWidth: 4,
    borderRadius: 8,
    transform: [{ rotate: '-20deg' }],
  },
  likeStamp: {
    right: 20,
    borderColor: '#10B981',
  },
  nopeStamp: {
    left: 20,
    borderColor: '#EF4444',
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
  cardInfo: {
    padding: 16,
    paddingTop: 12,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  petName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
  },
  petBreed: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  ownerText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  },
  locationDot: {
    color: colors.gray[400],
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 13,
    color: colors.gray[400],
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  traitBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  traitText: {
    fontSize: 12,
    color: colors.gray[700],
    fontWeight: '500',
  },
  servicesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  servicesLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  serviceBadge: {
    backgroundColor: '#EC489915',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  serviceText: {
    fontSize: 12,
    color: '#EC4899',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  actionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rewindBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  nopeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#EF444430',
  },
  superLikeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  likeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#EC489930',
  },
  boostBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  refreshBtn: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
  },
  refreshBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Match Modal
  matchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchContent: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 32,
    width: width - 48,
    alignItems: 'center',
  },
  matchHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#EC4899',
    marginBottom: 8,
  },
  matchSubtitle: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
  },
  matchImages: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#EC4899',
  },
  matchImage: {
    width: '100%',
    height: '100%',
  },
  matchHeart: {
    marginHorizontal: -10,
    zIndex: 1,
    backgroundColor: colors.white,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EC4899',
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
  matchActions: {
    width: '100%',
    gap: 12,
  },
  messageBtn: {
    backgroundColor: '#EC4899',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  messageBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  keepSwipingBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  keepSwipingText: {
    fontSize: 15,
    color: colors.gray[500],
    fontWeight: '500',
  },
});
