import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, getRoleColor } from '../theme/colors';
import { useAuth } from '../lib/auth';
import { eventsApi, cafesApi } from '../lib/api';
import logger from '../lib/logger';

type FilterType = 'all' | 'meetup' | 'adoption' | 'birthday' | 'workshop' | 'photoshoot' | 'competition';

interface PetEvent {
  id: string;
  cafeId: string;
  cafeName: string;
  title: string;
  description: string;
  eventType: string;
  date: string;
  startTime: string;
  coverImage: string;
  price: number;
  capacity: number;
  bookedCount: number;
  distance: string;
}

interface Cafe {
  id: string;
  name: string;
  image: string;
  rating: number;
  distance: string;
  priceRange: string;
  petAmenities: string[];
}

const eventFilters: { id: FilterType; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'meetup', label: 'Meetups', emoji: '🐕' },
  { id: 'adoption', label: 'Adoption', emoji: '💕' },
  { id: 'birthday', label: 'Birthdays', emoji: '🎂' },
  { id: 'workshop', label: 'Workshops', emoji: '📚' },
  { id: 'photoshoot', label: 'Photo', emoji: '📸' },
  { id: 'competition', label: 'Contests', emoji: '🏆' },
];

function normalizeEvent(item: any): PetEvent | null {
  const id = item?.id ?? item?._id;
  if (id === undefined || id === null) return null;
  const capacity = Number(item.capacity ?? 0);
  const bookedCount = Number(item.bookedCount ?? item.booked ?? 0);
  return {
    id: String(id),
    cafeId: String(item.cafeId ?? item.cafe?.id ?? ''),
    cafeName: item.cafeName ?? item.cafe?.name ?? '',
    title: item.title ?? 'Untitled event',
    description: item.description ?? '',
    eventType: String(item.eventType ?? item.type ?? 'meetup'),
    date: item.date ?? '',
    startTime: item.startTime ?? item.time ?? '',
    coverImage: item.coverImage ?? item.image ?? '',
    price: Number(item.price ?? 0),
    capacity,
    bookedCount,
    distance: typeof item.distance === 'string' ? item.distance : '',
  };
}

function normalizeCafe(item: any): Cafe | null {
  const id = item?.id ?? item?._id;
  if (id === undefined || id === null) return null;
  return {
    id: String(id),
    name: item.name ?? 'Pet cafe',
    image: item.image ?? item.photos?.[0] ?? item.coverImage ?? '',
    rating: Number(item.rating ?? 0),
    distance: typeof item.distance === 'string' ? item.distance : '',
    priceRange: item.priceRange ?? '',
    petAmenities: Array.isArray(item.petAmenities) ? item.petAmenities.map(String) : [],
  };
}

export default function EventsListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  // Viewer-role accent: CAFE staff keep the teal brand; OWNER/LOVER consumers
  // see their orange tab color instead of a mismatched teal.
  const ACCENT = getRoleColor(user?.role || 'OWNER');
  const styles = createStyles(ACCENT);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [eventsData, cafesData] = await Promise.all([
        eventsApi.getEvents(),
        cafesApi.getCafes(),
      ]);
      const eventList = eventsData.events || eventsData.data || eventsData || [];
      const cafeList = cafesData.cafes || cafesData.data || cafesData || [];
      setEvents((Array.isArray(eventList) ? eventList : []).map(normalizeEvent).filter((e): e is PetEvent => e !== null));
      setCafes((Array.isArray(cafeList) ? cafeList : []).map(normalizeCafe).filter((c): c is Cafe => c !== null));
    } catch (error) {
      logger.error('Failed to load events and cafes:', error);
      setEvents([]);
      setCafes([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const retry = () => {
    setLoading(true);
    loadAll();
  };

  const filteredEvents = events.filter(event => {
    const matchesFilter = activeFilter === 'all' || event.eventType === activeFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      event.title.toLowerCase().includes(q) ||
      event.cafeName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const openEvent = (eventId: string) => {
    try {
      navigation.navigate('Home', { screen: 'EventDetail', params: { eventId } });
    } catch (error) {
      logger.error('Failed to open event:', error);
      Alert.alert('Could not open event', 'Please try again.');
    }
  };

  const openCafe = (cafeId: string) => {
    try {
      navigation.navigate('Home', { screen: 'CafeDetail', params: { cafeId } });
    } catch (error) {
      logger.error('Failed to open cafe:', error);
      Alert.alert('Could not open cafe', 'Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events & Cafes</Text>
        <TouchableOpacity style={styles.mapButton}>
          <Ionicons name="map" size={20} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, cafes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filtersContainer}>
          {eventFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, activeFilter === filter.id && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text style={styles.filterEmoji}>{filter.emoji}</Text>
              <Text style={[styles.filterText, activeFilter === filter.id && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        {/* Featured Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <Text style={styles.sectionCount}>{filteredEvents.length} events</Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>{loadError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>
              {events.length === 0 ? 'No upcoming events right now' : 'No events found'}
            </Text>
          </View>
        ) : (
          filteredEvents.map((event) => {
            const fillPct = event.capacity > 0
              ? Math.min(100, (event.bookedCount / event.capacity) * 100)
              : 0;
            const spotsLeft = Math.max(0, event.capacity - event.bookedCount);
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => openEvent(event.id)}
              >
                {!!event.coverImage && <Image source={{ uri: event.coverImage }} style={styles.eventImage} />}
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>
                    {event.price === 0 ? 'Free' : `₹${event.price}`}
                  </Text>
                </View>
                <View style={styles.eventContent}>
                  <View style={styles.eventMeta}>
                    <Text style={styles.eventDate}>
                      {formatDate(event.date)}{event.startTime ? ` • ${event.startTime}` : ''}
                    </Text>
                    {!!event.distance && (
                      <View style={styles.distanceBadge}>
                        <Ionicons name="location" size={12} color={colors.gray[500]} />
                        <Text style={styles.distanceText}>{event.distance}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {!!event.cafeName && <Text style={styles.cafeName}>{event.cafeName}</Text>}
                  <View style={styles.eventFooter}>
                    <View style={styles.capacityInfo}>
                      <View style={styles.capacityBar}>
                        <View style={[styles.capacityFill, { width: `${fillPct}%` }]} />
                      </View>
                      <Text style={styles.capacityText}>{spotsLeft} spots left</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => openEvent(event.id)}
                    >
                      <Text style={styles.bookButtonText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Pet-Friendly Cafes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pet-Friendly Cafes</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: ACCENT }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {cafes.length === 0 && !loading && !loadError ? (
          <View style={styles.emptyState}>
            <Ionicons name="cafe-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No cafes listed yet</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cafesScroll}>
            {cafes.map((cafe) => (
              <TouchableOpacity
                key={cafe.id}
                style={styles.cafeCard}
                onPress={() => openCafe(cafe.id)}
              >
                {!!cafe.image && <Image source={{ uri: cafe.image }} style={styles.cafeImage} />}
                <View style={styles.cafeContent}>
                  <Text style={styles.cafeName2}>{cafe.name}</Text>
                  <View style={styles.cafeMetaRow}>
                    {cafe.rating > 0 && (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{cafe.rating.toFixed(1)}</Text>
                      </View>
                    )}
                    <Text style={styles.cafeMeta}>
                      {[cafe.distance, cafe.priceRange].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                  {cafe.petAmenities.length > 0 && (
                    <View style={styles.amenitiesRow}>
                      {cafe.petAmenities.slice(0, 2).map((amenity, i) => (
                        <View key={i} style={styles.amenityBadge}>
                          <Text style={styles.amenityText}>{amenity}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (ACCENT: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.gray[900] },
  mapButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${ACCENT}15`, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.gray[200] },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.gray[900] },
  filtersScroll: { maxHeight: 50, marginBottom: 8 },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], gap: 6 },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterEmoji: { fontSize: 14 },
  filterText: { fontSize: 13, fontWeight: '500', color: colors.gray[600] },
  filterTextActive: { color: colors.white },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  sectionCount: { fontSize: 13, color: colors.gray[500] },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  eventCard: { backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  eventImage: { width: '100%', height: 150 },
  eventBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  eventBadgeText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  eventContent: { padding: 16 },
  eventMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventDate: { fontSize: 13, color: ACCENT, fontWeight: '600' },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 12, color: colors.gray[500] },
  eventTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  cafeName: { fontSize: 14, color: colors.gray[500], marginBottom: 12 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityInfo: { flex: 1, marginRight: 12 },
  capacityBar: { height: 4, backgroundColor: colors.gray[100], borderRadius: 2, marginBottom: 4 },
  capacityFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 2 },
  capacityText: { fontSize: 12, color: colors.gray[500] },
  bookButton: { backgroundColor: ACCENT, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  bookButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  cafesScroll: { paddingLeft: 20 },
  cafeCard: { width: 200, backgroundColor: colors.white, borderRadius: 16, marginRight: 12, overflow: 'hidden', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cafeImage: { width: '100%', height: 100 },
  cafeContent: { padding: 12 },
  cafeName2: { fontSize: 15, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  cafeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.gray[700] },
  cafeMeta: { fontSize: 12, color: colors.gray[500] },
  amenitiesRow: { flexDirection: 'row', gap: 6 },
  amenityBadge: { backgroundColor: `${ACCENT}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  amenityText: { fontSize: 10, color: ACCENT, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: ACCENT, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
