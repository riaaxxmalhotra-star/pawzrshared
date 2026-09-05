import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, roleColors } from '../../theme/colors';

// Use centralized role color
const CAFE_COLOR = roleColors.CAFE;

type EventType = 'all' | 'upcoming' | 'past' | 'draft';

interface PetEvent {
  id: string;
  title: string;
  description: string;
  eventType: string;
  date: string;
  startTime: string;
  endTime: string;
  coverImage: string;
  price: number;
  capacity: number;
  bookedCount: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'draft';
}

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

export default function CafeEventsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<EventType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock data
  const events: PetEvent[] = [
    {
      id: '1',
      title: 'Sunday Pet Meetup',
      description: 'Bring your furry friends for a fun afternoon of socializing!',
      eventType: 'meetup',
      date: '2025-02-16',
      startTime: '3:00 PM',
      endTime: '6:00 PM',
      coverImage: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
      price: 299,
      capacity: 30,
      bookedCount: 24,
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Adoption Drive - Find Your Fur Baby',
      description: 'Partner event with local shelter. Meet adoptable pets!',
      eventType: 'adoption',
      date: '2025-02-22',
      startTime: '11:00 AM',
      endTime: '5:00 PM',
      coverImage: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400',
      price: 0,
      capacity: 50,
      bookedCount: 32,
      status: 'upcoming',
    },
    {
      id: '3',
      title: 'Bruno\'s 3rd Birthday Bash',
      description: 'Private birthday party for Bruno the Golden Retriever',
      eventType: 'birthday',
      date: '2025-02-23',
      startTime: '4:00 PM',
      endTime: '7:00 PM',
      coverImage: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400',
      price: 1500,
      capacity: 15,
      bookedCount: 8,
      status: 'upcoming',
    },
    {
      id: '4',
      title: 'Pet Photography Workshop',
      description: 'Learn how to capture perfect moments with your pets',
      eventType: 'photoshoot',
      date: '2025-03-01',
      startTime: '10:00 AM',
      endTime: '1:00 PM',
      coverImage: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=400',
      price: 499,
      capacity: 20,
      bookedCount: 12,
      status: 'draft',
    },
  ];

  const filteredEvents = events.filter(event => {
    if (activeTab === 'all') return true;
    if (activeTab === 'upcoming') return event.status === 'upcoming' || event.status === 'ongoing';
    if (activeTab === 'past') return event.status === 'completed';
    if (activeTab === 'draft') return event.status === 'draft';
    return true;
  });

  const tabs: { id: EventType; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'draft', label: 'Drafts' },
    { id: 'all', label: 'All' },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return CAFE_COLOR;
      case 'ongoing': return '#10B981';
      case 'completed': return colors.gray[400];
      case 'draft': return '#F59E0B';
      default: return colors.gray[400];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: CAFE_COLOR }]}
          onPress={() => navigation.navigate('CreateEvent')}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { backgroundColor: CAFE_COLOR }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Events List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CAFE_COLOR} />}
        contentContainerStyle={styles.listContainer}
      >
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
              <Ionicons name="calendar-outline" size={48} color={CAFE_COLOR} />
            </View>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>Create your first pet event!</Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: CAFE_COLOR }]}
              onPress={() => navigation.navigate('CreateEvent')}
            >
              <Text style={styles.emptyButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
            >
              <Image source={{ uri: event.coverImage }} style={styles.eventImage} />
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <View style={[styles.typeBadge, { backgroundColor: `${CAFE_COLOR}15` }]}>
                    <Ionicons name={eventTypeIcons[event.eventType] as any || 'calendar'} size={14} color={CAFE_COLOR} />
                    <Text style={[styles.typeText, { color: CAFE_COLOR }]}>{eventTypeLabels[event.eventType]}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(event.status)}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(event.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(event.status) }]}>{event.status}</Text>
                  </View>
                </View>

                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>

                <View style={styles.eventMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.metaText}>{formatDate(event.date)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.metaText}>{event.startTime}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color={colors.gray[400]} />
                    <Text style={styles.metaText}>{event.bookedCount}/{event.capacity}</Text>
                  </View>
                </View>

                <View style={styles.eventFooter}>
                  <Text style={styles.priceText}>
                    {event.price === 0 ? 'Free' : `₹${event.price}`}
                  </Text>
                  <View style={styles.capacityBar}>
                    <View style={[styles.capacityFill, { width: `${(event.bookedCount / event.capacity) * 100}%`, backgroundColor: CAFE_COLOR }]} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.gray[900] },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.gray[600] },
  tabTextActive: { color: colors.white },
  listContainer: { paddingHorizontal: 20 },
  eventCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImage: { width: '100%', height: 140 },
  eventContent: { padding: 16 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  typeText: { fontSize: 12, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  eventTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  eventDescription: { fontSize: 14, color: colors.gray[500], lineHeight: 20, marginBottom: 12 },
  eventMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: colors.gray[500] },
  eventFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceText: { fontSize: 18, fontWeight: '700', color: CAFE_COLOR },
  capacityBar: { flex: 1, height: 4, backgroundColor: colors.gray[100], borderRadius: 2, marginLeft: 16 },
  capacityFill: { height: '100%', borderRadius: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: colors.gray[500], marginBottom: 24 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  emptyButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
