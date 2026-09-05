import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, roleColors } from '../../theme/colors';

// Use centralized role color
const CAFE_COLOR = roleColors.CAFE;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TimeRange = 'today' | 'week' | 'month' | 'year';

interface RevenueData {
  label: string;
  value: number;
}

interface EventStats {
  name: string;
  bookings: number;
  revenue: number;
  rating: number;
}

export default function CafeAnalyticsScreen() {
  const navigation = useNavigation<any>();
  const [activeRange, setActiveRange] = useState<TimeRange>('week');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  // Mock analytics data
  const overviewStats = {
    totalRevenue: activeRange === 'today' ? 8500 : activeRange === 'week' ? 45600 : activeRange === 'month' ? 186400 : 2245000,
    totalBookings: activeRange === 'today' ? 12 : activeRange === 'week' ? 78 : activeRange === 'month' ? 324 : 3892,
    avgOrderValue: activeRange === 'today' ? 708 : activeRange === 'week' ? 585 : activeRange === 'month' ? 575 : 577,
    revenueGrowth: 12.5,
    bookingsGrowth: 8.3,
  };

  const revenueData: RevenueData[] = activeRange === 'week' ? [
    { label: 'Mon', value: 4200 },
    { label: 'Tue', value: 5800 },
    { label: 'Wed', value: 6200 },
    { label: 'Thu', value: 7500 },
    { label: 'Fri', value: 9800 },
    { label: 'Sat', value: 12100 },
    { label: 'Sun', value: 8500 },
  ] : [
    { label: 'W1', value: 38000 },
    { label: 'W2', value: 42000 },
    { label: 'W3', value: 48000 },
    { label: 'W4', value: 58400 },
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.value));

  const topEvents: EventStats[] = [
    { name: 'Sunday Pet Meetup', bookings: 156, revenue: 46800, rating: 4.9 },
    { name: 'Adoption Drive', bookings: 89, revenue: 0, rating: 4.8 },
    { name: 'Birthday Parties', bookings: 42, revenue: 63000, rating: 4.7 },
    { name: 'Photo Sessions', bookings: 38, revenue: 18962, rating: 4.9 },
  ];

  const bookingsBySource = [
    { source: 'App Direct', percentage: 45, color: CAFE_COLOR },
    { source: 'Events', percentage: 30, color: '#8B5CF6' },
    { source: 'Walk-ins', percentage: 15, color: '#F59E0B' },
    { source: 'Referrals', percentage: 10, color: '#10B981' },
  ];

  const peakHours = [
    { hour: '10 AM', bookings: 8 },
    { hour: '11 AM', bookings: 15 },
    { hour: '12 PM', bookings: 22 },
    { hour: '1 PM', bookings: 18 },
    { hour: '2 PM', bookings: 12 },
    { hour: '3 PM', bookings: 25 },
    { hour: '4 PM', bookings: 32 },
    { hour: '5 PM', bookings: 28 },
    { hour: '6 PM', bookings: 20 },
    { hour: '7 PM', bookings: 15 },
  ];

  const maxBookings = Math.max(...peakHours.map(h => h.bookings));

  const customerInsights = {
    newCustomers: 45,
    returningCustomers: 156,
    retentionRate: 78,
    avgVisitsPerCustomer: 3.2,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="share-outline" size={24} color={CAFE_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CAFE_COLOR} />}
      >
        {/* Time Range Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeScroll}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.id}
              style={[styles.timeRangeTab, activeRange === range.id && { backgroundColor: CAFE_COLOR }]}
              onPress={() => setActiveRange(range.id)}
            >
              <Text style={[styles.timeRangeText, activeRange === range.id && styles.timeRangeTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Overview Stats */}
        <View style={styles.overviewContainer}>
          <View style={[styles.overviewCard, styles.revenueCard]}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewLabel}>Total Revenue</Text>
              <View style={[styles.growthBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="trending-up" size={12} color={colors.white} />
                <Text style={styles.growthText}>+{overviewStats.revenueGrowth}%</Text>
              </View>
            </View>
            <Text style={styles.revenueValue}>{overviewStats.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.revenueCurrency}>INR</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                <Ionicons name="calendar" size={20} color={CAFE_COLOR} />
              </View>
              <Text style={styles.statValue}>{overviewStats.totalBookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
              <View style={[styles.growthBadge, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="trending-up" size={10} color="#10B981" />
                <Text style={[styles.growthText, { color: '#10B981' }]}>+{overviewStats.bookingsGrowth}%</Text>
              </View>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="receipt" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{overviewStats.avgOrderValue}</Text>
              <Text style={styles.statLabel}>Avg. Order</Text>
              <Text style={styles.statSubtext}>INR per visit</Text>
            </View>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {revenueData.map((data, index) => (
                <View key={index} style={styles.barContainer}>
                  <Text style={styles.barValue}>{(data.value / 1000).toFixed(1)}K</Text>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(data.value / maxRevenue) * 100}%`,
                          backgroundColor: index === revenueData.length - 1 ? CAFE_COLOR : `${CAFE_COLOR}60`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{data.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Top Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Events</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: CAFE_COLOR }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {topEvents.map((event, index) => (
            <View key={index} style={styles.eventRow}>
              <View style={styles.eventRank}>
                <Text style={styles.eventRankText}>{index + 1}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <View style={styles.eventMeta}>
                  <Ionicons name="people" size={12} color={colors.gray[400]} />
                  <Text style={styles.eventMetaText}>{event.bookings} bookings</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#F59E0B" />
                    <Text style={styles.ratingText}>{event.rating}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.eventRevenue}>
                {event.revenue > 0 ? `${(event.revenue / 1000).toFixed(1)}K` : 'Free'}
              </Text>
            </View>
          ))}
        </View>

        {/* Booking Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Sources</Text>
          <View style={styles.sourcesCard}>
            <View style={styles.progressBarContainer}>
              {bookingsBySource.map((source, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    { width: `${source.percentage}%`, backgroundColor: source.color },
                  ]}
                />
              ))}
            </View>
            <View style={styles.sourceLegend}>
              {bookingsBySource.map((source, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: source.color }]} />
                  <Text style={styles.legendText}>{source.source}</Text>
                  <Text style={styles.legendPercentage}>{source.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Peak Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peak Hours</Text>
          <View style={styles.peakHoursCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {peakHours.map((hour, index) => (
                <View key={index} style={styles.hourBar}>
                  <View style={styles.hourBarBackground}>
                    <View
                      style={[
                        styles.hourBarFill,
                        {
                          height: `${(hour.bookings / maxBookings) * 100}%`,
                          backgroundColor: hour.bookings === maxBookings ? CAFE_COLOR : `${CAFE_COLOR}50`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.hourLabel}>{hour.hour}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.peakNote}>
              <Ionicons name="information-circle" size={16} color={CAFE_COLOR} />
              <Text style={styles.peakNoteText}>Peak time: 4 PM - 5 PM with 32 bookings</Text>
            </View>
          </View>
        </View>

        {/* Customer Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="person-add" size={20} color="#10B981" />
              </View>
              <Text style={styles.insightValue}>{customerInsights.newCustomers}</Text>
              <Text style={styles.insightLabel}>New Customers</Text>
            </View>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="refresh" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.insightValue}>{customerInsights.returningCustomers}</Text>
              <Text style={styles.insightLabel}>Returning</Text>
            </View>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="heart" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.insightValue}>{customerInsights.retentionRate}%</Text>
              <Text style={styles.insightLabel}>Retention Rate</Text>
            </View>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                <Ionicons name="repeat" size={20} color={CAFE_COLOR} />
              </View>
              <Text style={styles.insightValue}>{customerInsights.avgVisitsPerCustomer}</Text>
              <Text style={styles.insightLabel}>Avg. Visits</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                <Ionicons name="download" size={20} color={CAFE_COLOR} />
              </View>
              <Text style={styles.quickActionText}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="mail" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>Email Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="calendar" size={20} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.gray[900] },
  headerAction: { padding: 4 },
  timeRangeScroll: { paddingLeft: 20, marginBottom: 20 },
  timeRangeTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginRight: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  timeRangeText: { fontSize: 14, fontWeight: '600', color: colors.gray[600] },
  timeRangeTextActive: { color: colors.white },
  overviewContainer: { paddingHorizontal: 20, marginBottom: 24 },
  overviewCard: { borderRadius: 20, padding: 20, marginBottom: 12 },
  revenueCard: { backgroundColor: CAFE_COLOR },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  overviewLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthText: { fontSize: 12, fontWeight: '600', color: colors.white },
  revenueValue: { fontSize: 36, fontWeight: 'bold', color: colors.white },
  revenueCurrency: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
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
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.gray[900] },
  statLabel: { fontSize: 13, color: colors.gray[500], marginTop: 4 },
  statSubtext: { fontSize: 11, color: colors.gray[400], marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900], paddingHorizontal: 20, marginBottom: 12 },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  chartContainer: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barContainer: { flex: 1, alignItems: 'center' },
  barValue: { fontSize: 10, color: colors.gray[500], marginBottom: 4 },
  barBackground: { width: 24, height: 120, backgroundColor: colors.gray[100], borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 11, color: colors.gray[500], marginTop: 8 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  eventRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${CAFE_COLOR}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventRankText: { fontSize: 14, fontWeight: '700', color: CAFE_COLOR },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: 4 },
  eventMeta: { flexDirection: 'row', alignItems: 'center' },
  eventMetaText: { fontSize: 12, color: colors.gray[500], marginLeft: 4, marginRight: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  eventRevenue: { fontSize: 16, fontWeight: '700', color: CAFE_COLOR },
  sourcesCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressBarContainer: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16 },
  progressSegment: { height: '100%' },
  sourceLegend: { gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { flex: 1, fontSize: 14, color: colors.gray[700] },
  legendPercentage: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  peakHoursCard: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hourBar: { alignItems: 'center', marginRight: 16 },
  hourBarBackground: {
    width: 32,
    height: 80,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  hourBarFill: { width: '100%', borderRadius: 8 },
  hourLabel: { fontSize: 10, color: colors.gray[500], marginTop: 8 },
  peakNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: 8,
  },
  peakNoteText: { fontSize: 13, color: colors.gray[600] },
  insightsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  insightCard: {
    width: (SCREEN_WIDTH - 56) / 2,
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
  insightIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  insightValue: { fontSize: 24, fontWeight: 'bold', color: colors.gray[900] },
  insightLabel: { fontSize: 12, color: colors.gray[500], marginTop: 4 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  quickAction: {
    flex: 1,
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
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionText: { fontSize: 12, fontWeight: '600', color: colors.gray[700], textAlign: 'center' },
});
