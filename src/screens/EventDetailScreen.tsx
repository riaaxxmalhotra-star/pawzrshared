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
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, getRoleColor } from '../theme/colors';
import { useAuth } from '../lib/auth';
import { eventsApi } from '../lib/api';
import logger from '../lib/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EventDetail {
  id: string;
  title: string;
  description: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  coverImage: string;
  photos: string[];
  price: number;
  capacity: number;
  bookedCount: number;
  cafeName: string;
  cafeId: string;
  cafeImage: string;
  cafeRating: number;
  location: string;
  petTypes: string[];
  amenities: string[];
  requirements: string[];
  organizer: {
    name: string;
    phone: string;
  };
  attendees: { name: string; avatar: string }[];
}

export default function EventDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const eventId = route.params?.eventId;
  const { user } = useAuth();
  // Viewer-role accent: CAFE staff keep the teal brand; OWNER/LOVER consumers
  // see their orange tab color instead of a mismatched teal.
  const ACCENT = getRoleColor(user?.role || 'OWNER');
  const styles = createStyles(ACCENT);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [petName, setPetName] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setLoadError('No event selected.');
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const data = await eventsApi.getEvent(String(eventId));
      const item = data.event || data || {};
      const capacity = Number(item.capacity ?? 0);
      setEvent({
        id: String(item.id ?? eventId),
        title: item.title ?? 'Untitled event',
        description: item.description ?? '',
        eventType: String(item.eventType ?? item.type ?? 'meetup'),
        date: item.date ?? '',
        startTime: item.startTime ?? item.time ?? '',
        endTime: item.endTime ?? '',
        coverImage: item.coverImage ?? item.image ?? '',
        photos: Array.isArray(item.photos) ? item.photos.map(String) : [],
        price: Number(item.price ?? 0),
        capacity,
        bookedCount: Number(item.bookedCount ?? item.booked ?? 0),
        cafeName: item.cafeName ?? item.cafe?.name ?? '',
        cafeId: String(item.cafeId ?? item.cafe?.id ?? ''),
        cafeImage: item.cafeImage ?? item.cafe?.image ?? '',
        cafeRating: Number(item.cafeRating ?? item.cafe?.rating ?? 0),
        location: item.location ?? item.address ?? '',
        petTypes: Array.isArray(item.petTypes) ? item.petTypes.map(String) : [],
        amenities: Array.isArray(item.amenities) ? item.amenities.map(String) : [],
        requirements: Array.isArray(item.requirements) ? item.requirements.map(String) : [],
        organizer: {
          name: item.organizer?.name ?? '',
          phone: item.organizer?.phone ?? '',
        },
        attendees: Array.isArray(item.attendees)
          ? item.attendees.map((a: any) => ({ name: String(a.name ?? ''), avatar: String(a.avatar ?? a.image ?? '') }))
          : [],
      });
    } catch (error) {
      logger.error('Failed to load event:', error);
      setEvent(null);
      setLoadError(error instanceof Error ? error.message : 'Could not load this event.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.centerStateText}>{loadError ?? 'Event not found.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); loadEvent(); }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const spotsLeft = Math.max(0, event.capacity - event.bookedCount);
  const isSoldOut = spotsLeft <= 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const openInMaps = () => {
    const address = encodeURIComponent(event.location);
    const url = Platform.select({
      ios: `maps://app?daddr=${address}`,
      android: `google.navigation:q=${address}`,
    });

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;

    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            return Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          Linking.openURL(webUrl);
        });
    } else {
      Linking.openURL(webUrl);
    }
  };

  const handleBooking = async () => {
    if (!petName.trim()) {
      Alert.alert('Required', 'Please enter your pet\'s name');
      return;
    }

    setIsBooking(true);
    try {
      await eventsApi.rsvpEvent(event.id, {
        guestCount,
        petName: petName.trim(),
        specialRequests: specialRequests.trim() || undefined,
      });
      setIsBooking(false);
      setShowBookingModal(false);
      Alert.alert(
        'Booking Confirmed!',
        `Your spot for ${event.title} has been reserved. You'll receive a confirmation message shortly.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      setIsBooking(false);
      logger.error('Event booking failed:', error);
      Alert.alert(
        'Booking failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const eventTypeIcons: Record<string, string> = {
    meetup: 'people',
    adoption: 'heart',
    birthday: 'gift',
    workshop: 'school',
    photoshoot: 'camera',
    grooming: 'cut',
    competition: 'trophy',
    movie_night: 'film',
  };

  const eventTypeLabels: Record<string, string> = {
    meetup: 'Pet Meetup',
    adoption: 'Adoption Event',
    birthday: 'Birthday Party',
    workshop: 'Workshop',
    photoshoot: 'Photo Shoot',
    grooming: 'Grooming Session',
    competition: 'Competition',
    movie_night: 'Movie Night',
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.coverImage }} style={styles.heroImage} />
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
        </View>

        {/* Event Info */}
        <View style={styles.content}>
          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: `${ACCENT}15` }]}>
            <Ionicons name={eventTypeIcons[event.eventType] as any || 'calendar'} size={14} color={ACCENT} />
            <Text style={[styles.typeText, { color: ACCENT }]}>{eventTypeLabels[event.eventType]}</Text>
          </View>

          {/* Title & Price */}
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {event.price === 0 ? 'Free Event' : `₹${event.price}`}
            </Text>
            {event.price > 0 && <Text style={styles.priceNote}>per person</Text>}
          </View>

          {/* Date & Time */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${ACCENT}15` }]}>
                <Ionicons name="calendar" size={20} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${ACCENT}15` }]}>
                <Ionicons name="time" size={20} color={ACCENT} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>{event.startTime} - {event.endTime}</Text>
              </View>
            </View>
          </View>

          {/* Capacity */}
          <View style={styles.capacityCard}>
            <View style={styles.capacityInfo}>
              <Ionicons name="people" size={20} color={isSoldOut ? '#EF4444' : ACCENT} />
              <Text style={styles.capacityText}>
                {isSoldOut ? 'Sold Out' : `${spotsLeft} spots left`}
              </Text>
            </View>
            <View style={styles.capacityBar}>
              <View
                style={[
                  styles.capacityFill,
                  {
                    width: `${(event.bookedCount / event.capacity) * 100}%`,
                    backgroundColor: isSoldOut ? '#EF4444' : ACCENT,
                  },
                ]}
              />
            </View>
            <Text style={styles.capacitySubtext}>{event.bookedCount} of {event.capacity} booked</Text>
          </View>

          {/* Attendees Preview */}
          {event.attendees.length > 0 && (
            <View style={styles.attendeesSection}>
              <Text style={styles.sectionTitle}>Who's Coming</Text>
              <View style={styles.attendeesRow}>
                <View style={styles.avatarStack}>
                  {event.attendees.slice(0, 5).map((attendee, index) => (
                    <Image
                      key={index}
                      source={{ uri: attendee.avatar }}
                      style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -12 : 0 }]}
                    />
                  ))}
                </View>
                <Text style={styles.attendeesText}>
                  {event.attendees[0].name}, {event.attendees[1].name} and {event.bookedCount - 2} others
                </Text>
              </View>
            </View>
          )}

          {/* Venue */}
          <View style={styles.venueCard}>
            <TouchableOpacity
              style={styles.venueInfo}
              onPress={() => navigation.navigate('CafeDetail', { cafeId: event.cafeId })}
            >
              <Image source={{ uri: event.cafeImage }} style={styles.venueImage} />
              <View style={styles.venueDetails}>
                <Text style={styles.venueName}>{event.cafeName}</Text>
                <View style={styles.venueRating}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.venueRatingText}>{event.cafeRating}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationRow} onPress={openInMaps} activeOpacity={0.7}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color={colors.gray[500]} />
                <Text style={styles.locationText}>{event.location}</Text>
              </View>
              <View style={styles.directionsButton}>
                <Ionicons name="navigate" size={14} color={colors.white} />
                <Text style={styles.directionsButtonText}>Directions</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>

          {/* Pet Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pets Welcome</Text>
            <View style={styles.tagsContainer}>
              {event.petTypes.map((pet, index) => (
                <View key={index} style={styles.tag}>
                  <Ionicons name="paw" size={14} color={ACCENT} />
                  <Text style={styles.tagText}>{pet}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.tagsContainer}>
              {event.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityTag}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            {event.requirements.map((req, index) => (
              <View key={index} style={styles.requirementRow}>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}
          </View>

          {/* Photos */}
          {event.photos.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {event.photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photoThumb} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Contact */}
          <View style={styles.contactCard}>
            <Text style={styles.contactLabel}>Organized by</Text>
            <Text style={styles.contactName}>{event.organizer.name}</Text>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="chatbubble-outline" size={18} color={ACCENT} />
              <Text style={styles.contactButtonText}>Contact Organizer</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Total</Text>
          <Text style={styles.bottomPriceValue}>
            {event.price === 0 ? 'Free' : `₹${event.price * guestCount}`}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, isSoldOut && styles.bookButtonDisabled]}
          onPress={() => setShowBookingModal(true)}
          disabled={isSoldOut}
        >
          <Text style={styles.bookButtonText}>
            {isSoldOut ? 'Sold Out' : 'Book Now'}
          </Text>
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
            <Text style={styles.modalTitle}>Book Event</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.bookingEventCard}>
              <Image source={{ uri: event.coverImage }} style={styles.bookingEventImage} />
              <View style={styles.bookingEventInfo}>
                <Text style={styles.bookingEventTitle}>{event.title}</Text>
                <Text style={styles.bookingEventDate}>{formatDate(event.date)}</Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Number of Guests</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                >
                  <Ionicons name="remove" size={24} color={ACCENT} />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{guestCount}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => setGuestCount(Math.min(spotsLeft, guestCount + 1))}
                >
                  <Ionicons name="add" size={24} color={ACCENT} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Pet's Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your pet's name"
                value={petName}
                onChangeText={setPetName}
                placeholderTextColor={colors.gray[400]}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Special Requests (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special requirements or notes..."
                value={specialRequests}
                onChangeText={setSpecialRequests}
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.priceSummary}>
              <View style={styles.priceLineItem}>
                <Text style={styles.priceLineLabel}>Event ({guestCount} {guestCount === 1 ? 'guest' : 'guests'})</Text>
                <Text style={styles.priceLineValue}>₹{event.price * guestCount}</Text>
              </View>
              <View style={[styles.priceLineItem, styles.totalLine]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{event.price * guestCount}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.confirmButton, isBooking && styles.confirmButtonDisabled]}
              onPress={handleBooking}
              disabled={isBooking}
            >
              <Text style={styles.confirmButtonText}>
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const createStyles = (ACCENT: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  centerStateText: { fontSize: 15, color: colors.gray[500], marginTop: 12, textAlign: 'center', lineHeight: 22 },
  retryButton: { marginTop: 16, backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
  backLink: { marginTop: 12, paddingVertical: 8 },
  backLinkText: { fontSize: 14, fontWeight: '600', color: ACCENT },
  heroContainer: { height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
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
  content: { padding: 20, marginTop: -40, backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  typeText: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.gray[900], marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  price: { fontSize: 24, fontWeight: 'bold', color: ACCENT },
  priceNote: { fontSize: 14, color: colors.gray[500], marginLeft: 4 },
  infoCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 12, color: colors.gray[500] },
  infoValue: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginTop: 2 },
  infoDivider: { height: 1, backgroundColor: colors.gray[200], marginVertical: 12 },
  capacityCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  capacityInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  capacityText: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginLeft: 8 },
  capacityBar: { height: 8, backgroundColor: colors.gray[200], borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  capacityFill: { height: '100%', borderRadius: 4 },
  capacitySubtext: { fontSize: 13, color: colors.gray[500] },
  attendeesSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 12 },
  attendeesRow: { flexDirection: 'row', alignItems: 'center' },
  avatarStack: { flexDirection: 'row' },
  attendeeAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.white },
  attendeesText: { fontSize: 14, color: colors.gray[600], marginLeft: 12, flex: 1 },
  venueCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  venueInfo: { flexDirection: 'row', alignItems: 'center' },
  venueImage: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  venueDetails: { flex: 1 },
  venueName: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  venueRating: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  venueRatingText: { fontSize: 14, fontWeight: '600', color: '#F59E0B', marginLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray[200] },
  locationInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationText: { fontSize: 14, color: colors.gray[600], marginLeft: 8, flex: 1 },
  directionsButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  directionsButtonText: { fontSize: 12, fontWeight: '600', color: colors.white },
  section: { marginBottom: 24 },
  description: { fontSize: 15, color: colors.gray[700], lineHeight: 24 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ACCENT}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagText: { fontSize: 14, color: ACCENT, fontWeight: '500' },
  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  amenityText: { fontSize: 14, color: '#10B981', fontWeight: '500' },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  requirementText: { fontSize: 14, color: colors.gray[700], marginLeft: 8 },
  photoThumb: { width: 120, height: 80, borderRadius: 12, marginRight: 12 },
  contactCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  contactLabel: { fontSize: 13, color: colors.gray[500] },
  contactName: { fontSize: 16, fontWeight: '600', color: colors.gray[900], marginTop: 4, marginBottom: 12 },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ACCENT,
    gap: 8,
  },
  contactButtonText: { fontSize: 14, fontWeight: '600', color: ACCENT },
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
  bottomPrice: { flex: 1 },
  bottomPriceLabel: { fontSize: 13, color: colors.gray[500] },
  bottomPriceValue: { fontSize: 24, fontWeight: 'bold', color: colors.gray[900] },
  bookButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  bookButtonDisabled: { backgroundColor: colors.gray[300] },
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
  bookingEventCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
  },
  bookingEventImage: { width: 80, height: 60, borderRadius: 12 },
  bookingEventInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  bookingEventTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  bookingEventDate: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  formSection: { marginBottom: 24 },
  formLabel: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: 8 },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${ACCENT}15`,
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
  textArea: { height: 100, textAlignVertical: 'top' },
  priceSummary: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  priceLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLineLabel: { fontSize: 14, color: colors.gray[600] },
  priceLineValue: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  totalLine: { borderTopWidth: 1, borderTopColor: colors.gray[200], paddingTop: 12, marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: ACCENT },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  confirmButton: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: { backgroundColor: colors.gray[300] },
  confirmButtonText: { fontSize: 16, fontWeight: '700', color: colors.white },
});
