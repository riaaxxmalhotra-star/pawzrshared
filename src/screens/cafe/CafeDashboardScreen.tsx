import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../lib/auth';
import { colors, roleColors } from '../../theme/colors';
import { eventsApi, cafesApi } from '../../lib/api';
import logger from '../../lib/logger';

// Use centralized role color
const CAFE_COLOR = roleColors.CAFE;

interface DashboardEvent {
  id: string;
  title: string;
  date: string;
  attendees: number;
  capacity: number;
}

interface DashboardBooking {
  id: string;
  name: string;
  guests: number;
  time: string;
  status: string;
}

function displayDate(value: unknown): string {
  if (typeof value !== 'string' || value === '') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CafeDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>([]);
  const [recentBookings, setRecentBookings] = useState<DashboardBooking[]>([]);
  const [todayStats, setTodayStats] = useState({ bookings: 0, revenue: 0, upcomingEvents: 0, pendingBookings: 0 });

  // Real data from the cafe's own events + bookings. No mock fallback and no
  // fabricated rating/visitor metrics — empty/error states are honest.
  const loadDashboard = useCallback(async () => {
    setLoadError(null);
    try {
      const [eventsData, bookingsData] = await Promise.all([
        eventsApi.getMyEvents(),
        cafesApi.getMyBookings(),
      ]);
      const eventList = eventsData.events ?? eventsData.data ?? eventsData ?? [];
      const bookingList = bookingsData.bookings ?? bookingsData.data ?? bookingsData ?? [];
      const events = (Array.isArray(eventList) ? eventList : [])
        .map((item: any): DashboardEvent | null => {
          const id = item?.id ?? item?._id;
          if (id === undefined || id === null) return null;
          return {
            id: String(id),
            title: item.title ?? 'Untitled event',
            date: displayDate(item.date),
            attendees: Number(item.bookedCount ?? item.booked ?? 0),
            capacity: Number(item.capacity ?? 0),
          };
        })
        .filter((e): e is DashboardEvent => e !== null);
      const bookings = (Array.isArray(bookingList) ? bookingList : [])
        .map((b: any, index: number): DashboardBooking => ({
          id: String(b?.id ?? b?._id ?? index),
          name: b?.customerName ?? b?.user?.name ?? b?.customer?.name ?? 'Customer',
          guests: Number(b?.partySize ?? b?.guestCount ?? 1),
          time: b?.time ?? displayDate(b?.date),
          status: b?.status ?? 'pending',
        }));
      setUpcomingEvents(events.slice(0, 3));
      setRecentBookings(bookings.slice(0, 3));
      setTodayStats({
        bookings: bookings.length,
        revenue: (Array.isArray(bookingList) ? bookingList : []).reduce(
          (s: number, b: any) => s + Number(b?.totalAmount ?? b?.amount ?? b?.price ?? 0), 0),
        upcomingEvents: events.length,
        pendingBookings: bookings.filter((b) => b.status === 'pending').length,
      });
    } catch (error) {
      logger.error('Failed to load cafe dashboard:', error);
      setUpcomingEvents([]);
      setRecentBookings([]);
      setTodayStats({ bookings: 0, revenue: 0, upcomingEvents: 0, pendingBookings: 0 });
      setLoadError(error instanceof Error ? error.message : 'Could not load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const quickActions = [
    { id: 'events', icon: 'calendar', label: 'My Events', screen: 'CafeEvents' },
    { id: 'create', icon: 'add-circle', label: 'Create Event', screen: 'CreateEvent' },
    { id: 'bookings', icon: 'book', label: 'Bookings', screen: 'CafeBookings' },
    { id: 'analytics', icon: 'analytics', label: 'Analytics', screen: 'CafeAnalytics' },
    { id: 'crm', icon: 'people', label: 'Customers', screen: 'CafeCRM' },
    { id: 'earnings', icon: 'wallet', label: 'Earnings', screen: 'Earnings' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return colors.gray[400];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CAFE_COLOR} />}
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={CAFE_COLOR} />
            <Text style={styles.centerStateText}>Loading dashboard...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.centerStateTitle}>Could not load dashboard</Text>
            <Text style={styles.centerStateText}>{loadError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: CAFE_COLOR }]}
              onPress={() => { setLoading(true); loadDashboard(); }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeGreeting}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{user?.businessName || user?.name || 'Cafe Owner'}</Text>
          </View>
          <View style={[styles.welcomeIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
            <Text style={styles.welcomeEmoji}>☕</Text>
          </View>
        </View>

        {/* Today's Overview */}
        <View style={[styles.overviewCard, { backgroundColor: CAFE_COLOR }]}>
          <Text style={styles.overviewTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.bookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.revenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.pendingBookings}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                <Ionicons name={action.icon as any} size={26} color={CAFE_COLOR} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CafeEvents')}>
            <Text style={[styles.seeAllText, { color: CAFE_COLOR }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
          {upcomingEvents.length === 0 ? (
            <Text style={styles.emptyListText}>No events yet — create your first one.</Text>
          ) : (
          upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              accessibilityRole="button"
              accessibilityLabel={`View event ${event.title}`}
            >
              <View style={[styles.eventBadge, { backgroundColor: `${CAFE_COLOR}15` }]}>
                <Ionicons name="calendar" size={16} color={CAFE_COLOR} />
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{event.date}</Text>
              <View style={styles.eventCapacity}>
                <Ionicons name="people" size={14} color={colors.gray[400]} />
                <Text style={styles.eventCapacityText}>{event.attendees}/{event.capacity}</Text>
              </View>
              <View style={styles.capacityBar}>
                <View style={[styles.capacityFill, { width: `${event.capacity > 0 ? (event.attendees / event.capacity) * 100 : 0}%`, backgroundColor: CAFE_COLOR }]} />
              </View>
            </TouchableOpacity>
          )))}
          <TouchableOpacity style={styles.createEventCard} onPress={() => navigation.navigate('CreateEvent')}>
            <View style={[styles.createEventIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
              <Ionicons name="add" size={32} color={CAFE_COLOR} />
            </View>
            <Text style={[styles.createEventText, { color: CAFE_COLOR }]}>Create Event</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Recent Bookings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Bookings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CafeBookings')}>
            <Text style={[styles.seeAllText, { color: CAFE_COLOR }]}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bookingsList}>
          {recentBookings.length === 0 ? (
            <Text style={styles.emptyListText}>No bookings yet.</Text>
          ) : (
          recentBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => navigation.navigate('CafeBookings')}
              accessibilityRole="button"
              accessibilityLabel={`Manage booking for ${booking.name}`}
            >
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingName}>{booking.name}</Text>
                <View style={styles.bookingMeta}>
                  <Ionicons name="people" size={14} color={colors.gray[400]} />
                  <Text style={styles.bookingMetaText}>{booking.guests} guests</Text>
                  <Ionicons name="time" size={14} color={colors.gray[400]} style={{ marginLeft: 12 }} />
                  <Text style={styles.bookingMetaText}>{booking.time}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(booking.status)}15` }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>{booking.status}</Text>
              </View>
            </TouchableOpacity>
          )))}
        </View>

        {/* Bottom Stats — real counts only. No fabricated rating/visitors. */}
        <View style={styles.bottomStats}>
          <View style={styles.bottomStatCard}>
            <Text style={styles.bottomStatEmoji}>📅</Text>
            <Text style={styles.bottomStatValue}>{todayStats.upcomingEvents}</Text>
            <Text style={styles.bottomStatLabel}>Events</Text>
          </View>
          <View style={styles.bottomStatCard}>
            <Text style={styles.bottomStatEmoji}>📖</Text>
            <Text style={styles.bottomStatValue}>{todayStats.bookings}</Text>
            <Text style={styles.bottomStatLabel}>Bookings</Text>
          </View>
          <View style={styles.bottomStatCard}>
            <Text style={styles.bottomStatEmoji}>⏳</Text>
            <Text style={styles.bottomStatValue}>{todayStats.pendingBookings}</Text>
            <Text style={styles.bottomStatLabel}>Pending</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 4,
    borderLeftColor: CAFE_COLOR,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeContent: { flex: 1 },
  welcomeGreeting: { fontSize: 14, color: colors.gray[500] },
  welcomeName: { fontSize: 22, fontWeight: 'bold', color: colors.gray[900], marginTop: 4 },
  welcomeIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  welcomeEmoji: { fontSize: 28 },
  overviewCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
  },
  overviewTitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: colors.white },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8 },
  actionCard: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.gray[700], textAlign: 'center' },
  eventsScroll: { paddingLeft: 20 },
  eventCard: {
    width: 160,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  eventDate: { fontSize: 12, color: colors.gray[500], marginBottom: 12 },
  eventCapacity: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eventCapacityText: { fontSize: 12, color: colors.gray[500], marginLeft: 4 },
  capacityBar: { height: 4, backgroundColor: colors.gray[100], borderRadius: 2 },
  capacityFill: { height: '100%', borderRadius: 2 },
  createEventCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.gray[100],
    borderStyle: 'dashed',
  },
  createEventIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  createEventText: { fontSize: 13, fontWeight: '600' },
  bookingsList: { paddingHorizontal: 20 },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: 4 },
  bookingMeta: { flexDirection: 'row', alignItems: 'center' },
  bookingMetaText: { fontSize: 13, color: colors.gray[500], marginLeft: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  bottomStats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 24 },
  bottomStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bottomStatEmoji: { fontSize: 24, marginBottom: 8 },
  bottomStatValue: { fontSize: 20, fontWeight: 'bold', color: colors.gray[900] },
  bottomStatLabel: { fontSize: 12, color: colors.gray[500], marginTop: 4 },
  emptyListText: { fontSize: 14, color: colors.gray[500], fontStyle: 'italic', paddingVertical: 8 },
  centerState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  centerStateTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], marginTop: 16, textAlign: 'center' },
  centerStateText: { fontSize: 14, color: colors.gray[500], marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
