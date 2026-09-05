import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../lib/auth';
import { colors, roleColors } from '../../theme/colors';

// Use centralized role color
const CAFE_COLOR = roleColors.CAFE;

export default function CafeDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Mock data - will be replaced with API data
  const todayStats = {
    bookings: 12,
    revenue: 8500,
    upcomingEvents: 3,
    pendingBookings: 4,
  };

  const upcomingEvents = [
    { id: '1', title: 'Pet Meetup Sunday', date: 'Sun, Feb 16', attendees: 24, capacity: 30 },
    { id: '2', title: 'Adoption Drive', date: 'Sat, Feb 22', attendees: 15, capacity: 50 },
    { id: '3', title: 'Dog Birthday Party', date: 'Sun, Feb 23', attendees: 8, capacity: 15 },
  ];

  const recentBookings = [
    { id: '1', name: 'Priya Sharma', guests: 4, time: '2:00 PM', status: 'confirmed' },
    { id: '2', name: 'Rahul Verma', guests: 2, time: '3:30 PM', status: 'pending' },
    { id: '3', name: 'Anita Desai', guests: 6, time: '5:00 PM', status: 'confirmed' },
  ];

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
          {upcomingEvents.map((event) => (
            <TouchableOpacity key={event.id} style={styles.eventCard}>
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
                <View style={[styles.capacityFill, { width: `${(event.attendees / event.capacity) * 100}%`, backgroundColor: CAFE_COLOR }]} />
              </View>
            </TouchableOpacity>
          ))}
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
          {recentBookings.map((booking) => (
            <TouchableOpacity key={booking.id} style={styles.bookingCard}>
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
          ))}
        </View>

        {/* Bottom Stats */}
        <View style={styles.bottomStats}>
          <View style={styles.bottomStatCard}>
            <Text style={styles.bottomStatEmoji}>📅</Text>
            <Text style={styles.bottomStatValue}>{todayStats.upcomingEvents}</Text>
            <Text style={styles.bottomStatLabel}>Events</Text>
          </View>
          <View style={styles.bottomStatCard}>
            <Text style={styles.bottomStatEmoji}>⭐</Text>
            <Text style={styles.bottomStatValue}>4.8</Text>
            <Text style={styles.bottomStatLabel}>Rating</Text>
          </View>
          <View style={styles.bottomStatCard}>
            <Text style={styles.bottomStatEmoji}>🐕</Text>
            <Text style={styles.bottomStatValue}>156</Text>
            <Text style={styles.bottomStatLabel}>Visitors</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
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
});
