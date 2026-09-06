import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, roleColors } from '../../theme/colors';
import { cafesApi } from '../../lib/api';
import logger from '../../lib/logger';

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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overview, setOverview] = useState({ totalRevenue: 0, totalBookings: 0, avgOrderValue: 0 });
  const [series, setSeries] = useState<RevenueData[]>([]);
  const [topEvents, setTopEvents] = useState<EventStats[]>([]);
  const [insights, setInsights] = useState({
    newCustomers: 0,
    returningCustomers: 0,
    retentionRate: 0,
    avgVisitsPerCustomer: 0,
  });

  const loadAnalytics = useCallback(async (range: TimeRange) => {
    setLoadError(null);
    try {
      const data = await cafesApi.getAnalytics(range === 'today' ? 'today' : range);
      const root = data.analytics || data || {};
      setOverview({
        totalRevenue: Number(root.totalRevenue ?? root.revenue ?? 0),
        totalBookings: Number(root.totalBookings ?? root.bookings ?? 0),
        avgOrderValue: Number(root.avgOrderValue ?? 0),
      });
      const rawSeries = root.revenueByDay ?? root.series ?? root.revenueTrend ?? [];
      setSeries(
        (Array.isArray(rawSeries) ? rawSeries : []).map((s: any) => ({
          label: String(s.label ?? s.day ?? s.date ?? ''),
          value: Number(s.value ?? s.revenue ?? s.total ?? 0),
        })).filter((s: RevenueData) => s.label !== '')
      );
      const rawEvents = root.topEvents ?? root.events ?? [];
      setTopEvents(
        (Array.isArray(rawEvents) ? rawEvents : []).map((e: any) => ({
          name: String(e.name ?? e.title ?? 'Event'),
          bookings: Number(e.bookings ?? e.bookingCount ?? 0),
          revenue: Number(e.revenue ?? 0),
          rating: Number(e.rating ?? 0),
        }))
      );
      const ci = root.customerInsights ?? root.customers ?? {};
      setInsights({
        newCustomers: Number(ci.newCustomers ?? 0),
        returningCustomers: Number(ci.returningCustomers ?? ci.returning ?? 0),
        retentionRate: Number(ci.retentionRate ?? 0),
        avgVisitsPerCustomer: Number(ci.avgVisitsPerCustomer ?? ci.avgVisits ?? 0),
      });
    } catch (error) {
      logger.error('Failed to load cafe analytics:', error);
      setLoadError(error instanceof Error ? error.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAnalytics(activeRange);
  }, [activeRange, loadAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics(activeRange);
  };

  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  const maxRevenue = Math.max(1, ...series.map(d => d.value));

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
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={CAFE_COLOR} />
            <Text style={styles.centerStateText}>Loading analytics...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.centerStateTitle}>Could not load analytics</Text>
            <Text style={styles.centerStateText}>{loadError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: CAFE_COLOR }]}
              onPress={() => { setLoading(true); loadAnalytics(activeRange); }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>

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
            </View>
            <Text style={styles.revenueValue}>{overview.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.revenueCurrency}>INR</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                <Ionicons name="calendar" size={20} color={CAFE_COLOR} />
              </View>
              <Text style={styles.statValue}>{overview.totalBookings}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="receipt" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{overview.avgOrderValue}</Text>
              <Text style={styles.statLabel}>Avg. Order</Text>
              <Text style={styles.statSubtext}>INR per visit</Text>
            </View>
          </View>
        </View>

        {/* Revenue Chart */}
        {series.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trend</Text>
          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {series.map((data, index) => (
                <View key={index} style={styles.barContainer}>
                  <Text style={styles.barValue}>{(data.value / 1000).toFixed(1)}K</Text>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(data.value / maxRevenue) * 100}%`,
                          backgroundColor: index === series.length - 1 ? CAFE_COLOR : `${CAFE_COLOR}60`,
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
        )}

        {/* Top Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Events</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: CAFE_COLOR }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {topEvents.length === 0 ? (
            <Text style={styles.emptySectionText}>No event data for this period yet.</Text>
          ) : (
          topEvents.map((event, index) => (
            <View key={index} style={styles.eventRow}>
              <View style={styles.eventRank}>
                <Text style={styles.eventRankText}>{index + 1}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <View style={styles.eventMeta}>
                  <Ionicons name="people" size={12} color={colors.gray[400]} />
                  <Text style={styles.eventMetaText}>{event.bookings} bookings</Text>
                  {event.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#F59E0B" />
                    <Text style={styles.ratingText}>{event.rating.toFixed(1)}</Text>
                  </View>
                  )}
                </View>
              </View>
              <Text style={styles.eventRevenue}>
                {event.revenue > 0 ? `${(event.revenue / 1000).toFixed(1)}K` : 'Free'}
              </Text>
            </View>
          )))}
        </View>

        {/* Customer Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="person-add" size={20} color="#10B981" />
              </View>
              <Text style={styles.insightValue}>{insights.newCustomers}</Text>
              <Text style={styles.insightLabel}>New Customers</Text>
            </View>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="refresh" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.insightValue}>{insights.returningCustomers}</Text>
              <Text style={styles.insightLabel}>Returning</Text>
            </View>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="heart" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.insightValue}>{insights.retentionRate}%</Text>
              <Text style={styles.insightLabel}>Retention Rate</Text>
            </View>
            <View style={styles.insightCard}>
              <View style={[styles.insightIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                <Ionicons name="repeat" size={20} color={CAFE_COLOR} />
              </View>
              <Text style={styles.insightValue}>{insights.avgVisitsPerCustomer}</Text>
              <Text style={styles.insightLabel}>Avg. Visits</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
        <View style={{ height: 100 }} />
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  centerStateTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[800], marginTop: 16, textAlign: 'center' },
  centerStateText: { fontSize: 14, color: colors.gray[500], marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
  emptySectionText: { fontSize: 14, color: colors.gray[500], fontStyle: 'italic' },
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
