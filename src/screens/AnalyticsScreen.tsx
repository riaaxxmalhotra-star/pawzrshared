import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { bookingsApi } from '../lib/api';
import logger from '../lib/logger';

const { width } = Dimensions.get('window');

interface BookingRecord {
  dateMs: number | null;
  status: string;
  revenue: number;
  customerId: string;
  service: string;
}

const PERIOD_DAYS = { week: 7, month: 30, year: 365 } as const;

export default function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return { color: '#10B981', title: 'Clinic Analytics' };
      case 'GROOMER':
        return { color: '#8B5CF6', title: 'Salon Analytics' };
      case 'SUPPLIER':
        return { color: '#3B82F6', title: 'Store Analytics' };
      case 'LOVER':
        return { color: '#F97316', title: 'My Analytics' };
      default:
        return { color: colors.primary, title: 'Analytics' };
    }
  };

  const config = getRoleConfig();

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await bookingsApi.getMyBookings();
      const list = data.bookings || data || [];
      setBookings(
        (Array.isArray(list) ? list : [])
          .map((b: any) => {
            const rawDate = b?.date ?? b?.createdAt;
            const parsed = typeof rawDate === 'string' ? new Date(rawDate).getTime() : NaN;
            return {
              dateMs: Number.isNaN(parsed) ? null : parsed,
              status: String(b?.status ?? 'pending'),
              revenue: Number(b?.price ?? b?.total ?? b?.amount ?? 0),
              customerId: String(b?.customerId ?? b?.user?.id ?? b?.customer?.id ?? b?.user?.email ?? ''),
              service: String(b?.service ?? b?.serviceName ?? 'Service'),
            } as BookingRecord;
          })
      );
    } catch (error) {
      logger.error('Failed to load analytics:', error);
      setBookings([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const windowStart = Date.now() - PERIOD_DAYS[selectedPeriod] * 86400000;
  const inWindow = bookings.filter(b => b.dateMs !== null && (b.dateMs as number) >= windowStart);

  const data = {
    totalBookings: inWindow.length,
    completedBookings: inWindow.filter(b => b.status === 'completed').length,
    cancelledBookings: inWindow.filter(b => b.status === 'cancelled' || b.status === 'no_show').length,
    revenue: inWindow
      .filter(b => b.status !== 'cancelled' && b.status !== 'no_show')
      .reduce((s, b) => s + b.revenue, 0),
    newClients: new Set(
      inWindow
        .filter(b => {
          const first = bookings
            .filter(x => x.customerId && x.customerId === b.customerId && x.dateMs !== null)
            .map(x => x.dateMs as number);
          return first.length > 0 && Math.min(...first) >= windowStart;
        })
        .map(b => b.customerId)
    ).size,
    repeatClients: new Set(
      inWindow
        .filter(b => {
          const count = bookings.filter(x => x.customerId && x.customerId === b.customerId).length;
          return count > 1;
        })
        .map(b => b.customerId)
    ).size,
  };

  // Last-7-days activity bars from real booking dates.
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = (() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (const b of bookings) {
      if (b.dateMs === null) continue;
      const diffDays = Math.floor((now.getTime() - (b.dateMs as number)) / 86400000);
      if (diffDays >= 0 && diffDays < 7) {
        counts[new Date(b.dateMs as number).getDay()] += 1;
      }
    }
    const ordered: { day: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      ordered.push({ day: dayNames[d.getDay()], value: counts[d.getDay()] });
    }
    return ordered;
  })();

  const maxValue = Math.max(1, ...weeklyData.map(d => d.value));

  const topServices = (() => {
    const freq = new Map<string, number>();
    for (const b of inWindow) freq.set(b.service, (freq.get(b.service) ?? 0) + 1);
    const total = Math.max(1, inWindow.length);
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / total) * 100) }));
  })();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookings(); }} tintColor={config.color} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={config.color} />
            <Text style={styles.centerStateText}>Loading analytics...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.centerStateTitle}>Could not load analytics</Text>
            <Text style={styles.centerStateText}>{loadError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: config.color }]}
              onPress={() => { setLoading(true); loadBookings(); }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodBtn,
                selectedPeriod === period && { backgroundColor: config.color },
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  selectedPeriod === period && styles.periodBtnTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderTopColor: config.color }]}>
              <Text style={styles.statValue}>{data.totalBookings}</Text>
              <Text style={styles.statLabel}>{userRole === 'LOVER' ? 'Total Jobs' : 'Total Bookings'}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
              <Text style={styles.statValue}>{data.completedBookings}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
              <Text style={styles.statValue}>—</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#EF4444' }]}>
              <Text style={styles.statValue}>{data.cancelledBookings}</Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={[styles.revenueCard, { backgroundColor: `${config.color}10` }]}>
            <View style={styles.revenueMain}>
              <Text style={styles.revenueLabel}>Total Earnings</Text>
              <Text style={[styles.revenueValue, { color: config.color }]}>
                ₹{data.revenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.revenueChange}>
              <Ionicons name="checkmark-done" size={18} color="#10B981" />
              <Text style={styles.revenueChangeText}>
                {data.completedBookings} completed this {selectedPeriod}
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <View style={styles.chartCard}>
            <View style={styles.barChart}>
              {weeklyData.map((item, index) => (
                <View key={item.day} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.value / maxValue) * 120,
                        backgroundColor: index === 5 ? config.color : `${config.color}50`,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Client Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{userRole === 'LOVER' ? 'Pet Owners' : 'Clients'}</Text>
          <View style={styles.clientStatsRow}>
            <View style={styles.clientStatCard}>
              <View style={[styles.clientStatIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="person-add" size={24} color="#10B981" />
              </View>
              <Text style={styles.clientStatValue}>{data.newClients}</Text>
              <Text style={styles.clientStatLabel}>New</Text>
            </View>
            <View style={styles.clientStatCard}>
              <View style={[styles.clientStatIcon, { backgroundColor: `${config.color}15` }]}>
                <Ionicons name="repeat" size={24} color={config.color} />
              </View>
              <Text style={styles.clientStatValue}>{data.repeatClients}</Text>
              <Text style={styles.clientStatLabel}>Repeat</Text>
            </View>
            <View style={styles.clientStatCard}>
              <View style={[styles.clientStatIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="star" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.clientStatValue}>—</Text>
              <Text style={styles.clientStatLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Top Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top {userRole === 'LOVER' ? 'Services' : 'Services'}</Text>
          <View style={styles.servicesCard}>
            {topServices.length === 0 ? (
              <Text style={styles.emptyServicesText}>No bookings in this period yet.</Text>
            ) : (
            topServices.map((service, index) => (
              <View key={service.name} style={styles.serviceItem}>
                <View style={styles.serviceRank}>
                  <Text style={styles.serviceRankText}>{index + 1}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${service.percentage}%`, backgroundColor: config.color },
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.serviceCount}>{service.count}</Text>
              </View>
            )))}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  centerStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray[800],
    marginTop: 16,
    textAlign: 'center',
  },
  centerStateText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  emptyServicesText: {
    fontSize: 14,
    color: colors.gray[500],
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  periodBtnTextActive: {
    color: colors.white,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  revenueCard: {
    borderRadius: 16,
    padding: 20,
  },
  revenueMain: {
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  revenueChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revenueChangeText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 6,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: '500',
  },
  clientStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  clientStatCard: {
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
  clientStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  clientStatLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  servicesCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  serviceRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  serviceCount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[700],
    marginLeft: 12,
  },
});
