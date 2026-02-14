import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';

const CAFE_COLOR = '#14B8A6';

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

export default function EventsListScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock data
  const events: PetEvent[] = [
    {
      id: '1',
      cafeId: 'c1',
      cafeName: 'Paws & Coffee',
      title: 'Sunday Pet Meetup',
      description: 'Bring your furry friends for a fun afternoon of socializing!',
      eventType: 'meetup',
      date: '2025-02-16',
      startTime: '3:00 PM',
      coverImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      price: 299,
      capacity: 30,
      bookedCount: 24,
      distance: '1.2 km',
    },
    {
      id: '2',
      cafeId: 'c2',
      cafeName: 'The Pet Lounge',
      title: 'Adoption Drive - Find Your Fur Baby',
      description: 'Partner event with local shelter. Meet adoptable pets!',
      eventType: 'adoption',
      date: '2025-02-22',
      startTime: '11:00 AM',
      coverImage: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
      price: 0,
      capacity: 50,
      bookedCount: 32,
      distance: '2.5 km',
    },
    {
      id: '3',
      cafeId: 'c1',
      cafeName: 'Paws & Coffee',
      title: 'Pet Photography Workshop',
      description: 'Learn how to capture perfect moments with your pets',
      eventType: 'photoshoot',
      date: '2025-03-01',
      startTime: '10:00 AM',
      coverImage: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400',
      price: 499,
      capacity: 20,
      bookedCount: 12,
      distance: '1.2 km',
    },
    {
      id: '4',
      cafeId: 'c3',
      cafeName: 'Furry Friends Cafe',
      title: 'Dog Agility Competition',
      description: 'Show off your dog\'s skills in our fun agility course!',
      eventType: 'competition',
      date: '2025-03-08',
      startTime: '2:00 PM',
      coverImage: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400',
      price: 199,
      capacity: 40,
      bookedCount: 28,
      distance: '3.8 km',
    },
  ];

  const cafes: Cafe[] = [
    {
      id: 'c1',
      name: 'Paws & Coffee',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      rating: 4.8,
      distance: '1.2 km',
      priceRange: '$$',
      petAmenities: ['Dog-friendly', 'Pet Menu', 'Play Area'],
    },
    {
      id: 'c2',
      name: 'The Pet Lounge',
      image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400',
      rating: 4.6,
      distance: '2.5 km',
      priceRange: '$$$',
      petAmenities: ['Cat-friendly', 'AC Indoor', 'Pet Products'],
    },
    {
      id: 'c3',
      name: 'Furry Friends Cafe',
      image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400',
      rating: 4.5,
      distance: '3.8 km',
      priceRange: '$',
      petAmenities: ['Dog-friendly', 'Outdoor Space'],
    },
  ];

  const filteredEvents = events.filter(event => {
    const matchesFilter = activeFilter === 'all' || event.eventType === activeFilter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.cafeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events & Cafes</Text>
        <TouchableOpacity style={styles.mapButton}>
          <Ionicons name="map" size={20} color={CAFE_COLOR} />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CAFE_COLOR} />}
      >
        {/* Featured Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <Text style={styles.sectionCount}>{filteredEvents.length} events</Text>
        </View>

        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyText}>No events found</Text>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('Home', { screen: 'EventDetail', params: { eventId: event.id } })}
            >
              <Image source={{ uri: event.coverImage }} style={styles.eventImage} />
              <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeText}>
                  {event.price === 0 ? 'Free' : `₹${event.price}`}
                </Text>
              </View>
              <View style={styles.eventContent}>
                <View style={styles.eventMeta}>
                  <Text style={styles.eventDate}>{formatDate(event.date)} • {event.startTime}</Text>
                  <View style={styles.distanceBadge}>
                    <Ionicons name="location" size={12} color={colors.gray[500]} />
                    <Text style={styles.distanceText}>{event.distance}</Text>
                  </View>
                </View>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.cafeName}>{event.cafeName}</Text>
                <View style={styles.eventFooter}>
                  <View style={styles.capacityInfo}>
                    <View style={styles.capacityBar}>
                      <View style={[styles.capacityFill, { width: `${(event.bookedCount / event.capacity) * 100}%` }]} />
                    </View>
                    <Text style={styles.capacityText}>{event.capacity - event.bookedCount} spots left</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('Home', { screen: 'EventDetail', params: { eventId: event.id } })}
                  >
                    <Text style={styles.bookButtonText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Pet-Friendly Cafes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pet-Friendly Cafes</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: CAFE_COLOR }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cafesScroll}>
          {cafes.map((cafe) => (
            <TouchableOpacity
              key={cafe.id}
              style={styles.cafeCard}
              onPress={() => navigation.navigate('Home', { screen: 'CafeDetail', params: { cafeId: cafe.id } })}
            >
              <Image source={{ uri: cafe.image }} style={styles.cafeImage} />
              <View style={styles.cafeContent}>
                <Text style={styles.cafeName2}>{cafe.name}</Text>
                <View style={styles.cafeMetaRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{cafe.rating}</Text>
                  </View>
                  <Text style={styles.cafeMeta}>{cafe.distance} • {cafe.priceRange}</Text>
                </View>
                <View style={styles.amenitiesRow}>
                  {cafe.petAmenities.slice(0, 2).map((amenity, i) => (
                    <View key={i} style={styles.amenityBadge}>
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.gray[900] },
  mapButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${CAFE_COLOR}15`, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.gray[200] },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.gray[900] },
  filtersScroll: { maxHeight: 50, marginBottom: 8 },
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray[200], gap: 6 },
  filterChipActive: { backgroundColor: CAFE_COLOR, borderColor: CAFE_COLOR },
  filterEmoji: { fontSize: 14 },
  filterText: { fontSize: 13, fontWeight: '500', color: colors.gray[600] },
  filterTextActive: { color: colors.white },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  sectionCount: { fontSize: 13, color: colors.gray[500] },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  eventCard: { backgroundColor: colors.white, marginHorizontal: 20, marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  eventImage: { width: '100%', height: 150 },
  eventBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: CAFE_COLOR, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  eventBadgeText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  eventContent: { padding: 16 },
  eventMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventDate: { fontSize: 13, color: CAFE_COLOR, fontWeight: '600' },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 12, color: colors.gray[500] },
  eventTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  cafeName: { fontSize: 14, color: colors.gray[500], marginBottom: 12 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityInfo: { flex: 1, marginRight: 12 },
  capacityBar: { height: 4, backgroundColor: colors.gray[100], borderRadius: 2, marginBottom: 4 },
  capacityFill: { height: '100%', backgroundColor: CAFE_COLOR, borderRadius: 2 },
  capacityText: { fontSize: 12, color: colors.gray[500] },
  bookButton: { backgroundColor: CAFE_COLOR, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
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
  amenityBadge: { backgroundColor: `${CAFE_COLOR}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  amenityText: { fontSize: 10, color: CAFE_COLOR, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12 },
});
