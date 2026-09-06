import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { cafesApi } from '../lib/api';
import logger from '../lib/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAFE_COLOR = '#14B8A6';

interface CafeDetail {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  photos: string[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  address: string;
  city: string;
  phone: string;
  website?: string;
  petAmenities: string[];
  generalAmenities: string[];
  openTime: string;
  closeTime: string;
  workingDays: string[];
  seatingCapacity: number;
  upcomingEvents: { id: string; title: string; date: string; image: string }[];
  reviews: { name: string; avatar: string; rating: number; comment: string; date: string; petName: string }[];
}

function nextFiveDays(): { label: string; value: string }[] {
  const days: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const value = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
    const label =
      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    days.push({ label, value });
  }
  return days;
}

export default function CafeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const cafeId = route.params?.cafeId;

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [petName, setPetName] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [cafe, setCafe] = useState<CafeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const availableDates = nextFiveDays();
  const availableTimes = ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];

  const loadCafe = useCallback(async () => {
    if (!cafeId) {
      setLoadError('No cafe selected.');
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const [detailData, eventsData, reviewsData] = await Promise.all([
        cafesApi.getCafe(String(cafeId)),
        cafesApi.getCafeEvents(String(cafeId)).catch(() => ({ events: [] })),
        cafesApi.getCafeReviews(String(cafeId)).catch(() => ({ reviews: [] })),
      ]);
      const item = detailData.cafe || detailData || {};
      const photos = Array.isArray(item.photos) ? item.photos.map(String)
        : Array.isArray(item.images) ? item.images.map(String) : [];
      const coverImage = item.coverImage ?? photos[0] ?? item.image ?? '';
      const eventList = eventsData.events || eventsData || [];
      const reviewList = reviewsData.reviews || reviewsData || [];
      setCafe({
        id: String(item.id ?? cafeId),
        name: item.name ?? 'Pet cafe',
        description: item.description ?? '',
        coverImage,
        photos,
        rating: Number(item.rating ?? 0),
        reviewCount: Number(item.reviewCount ?? (Array.isArray(reviewList) ? reviewList.length : 0)),
        priceRange: item.priceRange ?? '',
        address: item.address ?? '',
        city: item.city ?? '',
        phone: item.phone ?? '',
        website: item.website ?? undefined,
        petAmenities: Array.isArray(item.petAmenities) ? item.petAmenities.map(String) : [],
        generalAmenities: Array.isArray(item.generalAmenities ?? item.amenities)
          ? (item.generalAmenities ?? item.amenities).map(String) : [],
        openTime: item.openTime ?? '',
        closeTime: item.closeTime ?? '',
        workingDays: Array.isArray(item.workingDays) ? item.workingDays.map(String) : [],
        seatingCapacity: Number(item.seatingCapacity ?? 0),
        upcomingEvents: (Array.isArray(eventList) ? eventList : []).map((e: any) => ({
          id: String(e.id ?? e._id ?? ''),
          title: String(e.title ?? 'Event'),
          date: String(e.date ?? ''),
          image: String(e.coverImage ?? e.image ?? ''),
        })).filter((e: { id: string }) => e.id !== ''),
        reviews: (Array.isArray(reviewList) ? reviewList : []).map((r: any) => ({
          name: String(r.name ?? r.user?.name ?? 'Guest'),
          avatar: String(r.avatar ?? r.user?.image ?? ''),
          rating: Number(r.rating ?? 0),
          comment: String(r.comment ?? r.text ?? ''),
          date: String(r.date ?? r.createdAt ?? ''),
          petName: String(r.petName ?? r.pet?.name ?? ''),
        })),
      });
    } catch (error) {
      logger.error('Failed to load cafe:', error);
      setCafe(null);
      setLoadError(error instanceof Error ? error.message : 'Could not load this cafe.');
    } finally {
      setLoading(false);
    }
  }, [cafeId]);

  useEffect(() => {
    loadCafe();
  }, [loadCafe]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={CAFE_COLOR} />
        </View>
      </View>
    );
  }

  if (loadError || !cafe) {
    return (
      <View style={styles.container}>
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.centerStateText}>{loadError ?? 'Cafe not found.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadCafe(); }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBooking = async () => {
    if (!selectedDate) {
      Alert.alert('Required', 'Please select a date');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Required', 'Please select a time');
      return;
    }

    setIsBooking(true);
    try {
      await cafesApi.bookTable(cafe.id, {
        date: selectedDate,
        time: selectedTime,
        guestCount,
        petName: petName.trim() || undefined,
      });
      setIsBooking(false);
      setShowBookingModal(false);
      Alert.alert(
        'Table Reserved!',
        `Your table for ${guestCount} at ${cafe.name} has been reserved for ${selectedDate} at ${selectedTime}. You'll receive a confirmation message shortly.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      setIsBooking(false);
      logger.error('Table booking failed:', error);
      Alert.alert('Booking failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleCall = () => {
    if (!cafe.phone) {
      Alert.alert('No phone number', 'This cafe has not listed a phone number.');
      return;
    }
    Linking.openURL(`tel:${cafe.phone.replace(/\s/g, '')}`).catch(() => {
      Alert.alert('Could not place call', 'Please try again.');
    });
  };

  const handleDirections = () => {
    const query = encodeURIComponent([cafe.address, cafe.city].filter(Boolean).join(', ') || cafe.name);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      Alert.alert('Could not open maps', 'Please try again.');
    });
  };

  const handleWebsite = () => {
    if (!cafe.website) {
      Alert.alert('No website', 'This cafe has not listed a website.');
      return;
    }
    const url = /^https?:\/\//i.test(cafe.website) ? cafe.website : `https://${cafe.website}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open website', 'Please try again.');
    });
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
        size={16}
        color="#F59E0B"
      />
    ));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {!!cafe.coverImage && <Image source={{ uri: cafe.coverImage }} style={styles.heroImage} />}
          <View style={styles.heroOverlay} />
          <SafeAreaView style={styles.heroContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.heroActionButton}>
                <Ionicons name="heart-outline" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroActionButton}>
                <Ionicons name="share-outline" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          {/* Photo Gallery Indicator */}
          <TouchableOpacity style={styles.photoCountBadge}>
            <Ionicons name="images" size={16} color={colors.white} />
            <Text style={styles.photoCountText}>{cafe.photos.length} Photos</Text>
          </TouchableOpacity>
        </View>

        {/* Cafe Info */}
        <View style={styles.content}>
          {/* Name & Rating */}
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text style={styles.cafeName}>{cafe.name}</Text>
              <View style={styles.ratingRow}>
                <View style={styles.stars}>{renderStars(cafe.rating)}</View>
                <Text style={styles.ratingText}>{cafe.rating}</Text>
                <Text style={styles.reviewCount}>({cafe.reviewCount} reviews)</Text>
              </View>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{cafe.priceRange}</Text>
            </View>
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfoCard}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="location" size={20} color={CAFE_COLOR} />
              <View>
                <Text style={styles.quickInfoLabel}>Location</Text>
                <Text style={styles.quickInfoValue}>{cafe.address}</Text>
              </View>
            </View>
            <View style={styles.quickInfoDivider} />
            <View style={styles.quickInfoItem}>
              <Ionicons name="time" size={20} color={CAFE_COLOR} />
              <View>
                <Text style={styles.quickInfoLabel}>Hours</Text>
                <Text style={styles.quickInfoValue}>{cafe.openTime} - {cafe.closeTime}</Text>
              </View>
            </View>
          </View>

          {/* Contact Buttons */}
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Ionicons name="call" size={20} color={CAFE_COLOR} />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={20} color={CAFE_COLOR} />
              <Text style={styles.contactButtonText}>Directions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleWebsite}>
              <Ionicons name="globe" size={20} color={CAFE_COLOR} />
              <Text style={styles.contactButtonText}>Website</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{cafe.description}</Text>
          </View>

          {/* Pet Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pet Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {cafe.petAmenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <View style={[styles.amenityIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                    <Ionicons name="paw" size={16} color={CAFE_COLOR} />
                  </View>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* General Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {cafe.generalAmenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <View style={[styles.amenityIcon, { backgroundColor: colors.gray[100] }]}>
                    <Ionicons name="checkmark" size={16} color={colors.gray[600]} />
                  </View>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Upcoming Events */}
          {cafe.upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                <TouchableOpacity>
                  <Text style={[styles.seeAllText, { color: CAFE_COLOR }]}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {cafe.upcomingEvents.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.eventCard}
                    onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  >
                    <Image source={{ uri: event.image }} style={styles.eventImage} />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventDate}>{event.date}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: CAFE_COLOR }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {cafe.reviews.length === 0 ? (
              <Text style={styles.noReviewsText}>No reviews yet — be the first to visit!</Text>
            ) : (
            cafe.reviews.map((review, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  {!!review.avatar && <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />}
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewName}>{review.name}</Text>
                    <View style={styles.reviewMeta}>
                      <View style={styles.stars}>{renderStars(review.rating)}</View>
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                {!!review.petName && (
                <View style={styles.reviewPet}>
                  <Ionicons name="paw" size={12} color={CAFE_COLOR} />
                  <Text style={styles.reviewPetText}>Visited with {review.petName}</Text>
                </View>
                )}
              </View>
            )))}
          </View>

          {/* Photo Gallery */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cafe.photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.openStatus}>Open Now</Text>
          <Text style={styles.closingTime}>Closes at {cafe.closeTime}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => setShowBookingModal(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.white} />
          <Text style={styles.bookButtonText}>Book Table</Text>
        </TouchableOpacity>
      </View>

      {/* Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBookingModal(false)}>
              <Ionicons name="close" size={28} color={colors.gray[900]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Book a Table</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.bookingCafeCard}>
              <Image source={{ uri: cafe.coverImage }} style={styles.bookingCafeImage} />
              <View style={styles.bookingCafeInfo}>
                <Text style={styles.bookingCafeName}>{cafe.name}</Text>
                <Text style={styles.bookingCafeAddress}>{cafe.address}</Text>
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableDates.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateOption,
                      selectedDate === date.value && { backgroundColor: CAFE_COLOR },
                    ]}
                    onPress={() => setSelectedDate(date.value)}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      selectedDate === date.value && { color: colors.white },
                    ]}>
                      {date.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Select Time</Text>
              <View style={styles.timeGrid}>
                {availableTimes.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeOption,
                      selectedTime === time && { backgroundColor: CAFE_COLOR },
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      selectedTime === time && { color: colors.white },
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Guest Count */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Number of Guests</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                >
                  <Ionicons name="remove" size={24} color={CAFE_COLOR} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{guestCount}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setGuestCount(Math.min(10, guestCount + 1))}
                >
                  <Ionicons name="add" size={24} color={CAFE_COLOR} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pet Name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Pet's Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your pet's name"
                value={petName}
                onChangeText={setPetName}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.bookingNote}>
              <Ionicons name="information-circle" size={20} color={CAFE_COLOR} />
              <Text style={styles.bookingNoteText}>
                Free cancellation up to 2 hours before your reservation
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.confirmButton, isBooking && styles.confirmButtonDisabled]}
              onPress={handleBooking}
              disabled={isBooking}
            >
              <Text style={styles.confirmButtonText}>
                {isBooking ? 'Booking...' : 'Confirm Reservation'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  centerStateText: { fontSize: 15, color: colors.gray[500], marginTop: 12, textAlign: 'center', lineHeight: 22 },
  retryButton: { marginTop: 16, backgroundColor: CAFE_COLOR, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
  backLink: { marginTop: 12, paddingVertical: 8 },
  backLinkText: { fontSize: 14, fontWeight: '600', color: CAFE_COLOR },
  noReviewsText: { fontSize: 14, color: colors.gray[500], fontStyle: 'italic' },
  heroContainer: { height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: { flexDirection: 'row', gap: 12 },
  heroActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  photoCountText: { color: colors.white, fontSize: 13, fontWeight: '500' },
  content: { padding: 20, marginTop: -40, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerInfo: { flex: 1 },
  cafeName: { fontSize: 26, fontWeight: 'bold', color: colors.gray[900], marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  stars: { flexDirection: 'row' },
  ratingText: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginLeft: 8 },
  reviewCount: { fontSize: 14, color: colors.gray[500], marginLeft: 4 },
  priceTag: {
    backgroundColor: `${CAFE_COLOR}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: { fontSize: 16, fontWeight: '700', color: CAFE_COLOR },
  quickInfoCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  quickInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickInfoLabel: { fontSize: 12, color: colors.gray[500] },
  quickInfoValue: { fontSize: 14, fontWeight: '600', color: colors.gray[900], marginTop: 2 },
  quickInfoDivider: { height: 1, backgroundColor: colors.gray[200], marginVertical: 12 },
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${CAFE_COLOR}10`,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: { fontSize: 14, fontWeight: '600', color: CAFE_COLOR },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 12 },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  description: { fontSize: 15, color: colors.gray[700], lineHeight: 24 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', width: '45%', gap: 8 },
  amenityIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  amenityText: { fontSize: 14, color: colors.gray[700], flex: 1 },
  menuCard: { width: 120, marginRight: 12, alignItems: 'center' },
  menuImage: { width: 100, height: 100, borderRadius: 12, marginBottom: 8 },
  petFriendlyBadge: {
    position: 'absolute',
    top: 8,
    right: 18,
    backgroundColor: CAFE_COLOR,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuName: { fontSize: 14, fontWeight: '600', color: colors.gray[900], textAlign: 'center' },
  menuPrice: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  eventCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: { width: '100%', height: 100 },
  eventInfo: { padding: 12 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  eventDate: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  reviewCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: 'row', marginBottom: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22 },
  reviewInfo: { flex: 1, marginLeft: 12 },
  reviewName: { fontSize: 15, fontWeight: '600', color: colors.gray[900] },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  reviewDate: { fontSize: 12, color: colors.gray[400], marginLeft: 8 },
  reviewComment: { fontSize: 14, color: colors.gray[700], lineHeight: 20, marginBottom: 8 },
  reviewPet: { flexDirection: 'row', alignItems: 'center' },
  reviewPetText: { fontSize: 12, color: CAFE_COLOR, marginLeft: 4 },
  galleryImage: { width: 140, height: 100, borderRadius: 12, marginRight: 12 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomInfo: { flex: 1 },
  openStatus: { fontSize: 15, fontWeight: '700', color: '#10B981' },
  closingTime: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CAFE_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  bookButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  modalContent: { flex: 1, padding: 20 },
  bookingCafeCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
  },
  bookingCafeImage: { width: 80, height: 60, borderRadius: 12 },
  bookingCafeInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  bookingCafeName: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  bookingCafeAddress: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  formSection: { marginBottom: 24 },
  formLabel: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: 12 },
  dateOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    marginRight: 10,
  },
  dateOptionText: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeOption: {
    width: (SCREEN_WIDTH - 70) / 3,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  timeOptionText: { fontSize: 14, fontWeight: '600', color: colors.gray[700] },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${CAFE_COLOR}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: { fontSize: 24, fontWeight: 'bold', color: colors.gray[900], marginHorizontal: 32 },
  input: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.gray[900],
  },
  bookingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${CAFE_COLOR}10`,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  bookingNoteText: { flex: 1, fontSize: 14, color: colors.gray[700] },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  confirmButton: {
    backgroundColor: CAFE_COLOR,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: { backgroundColor: colors.gray[300] },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
