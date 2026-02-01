import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

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

  // Mock analytics data
  const analyticsData = {
    week: {
      totalBookings: 12,
      completedBookings: 10,
      cancelledBookings: 2,
      revenue: 8500,
      avgRating: 4.8,
      newClients: 3,
      repeatClients: 7,
    },
    month: {
      totalBookings: 48,
      completedBookings: 42,
      cancelledBookings: 6,
      revenue: 35600,
      avgRating: 4.9,
      newClients: 12,
      repeatClients: 30,
    },
    year: {
      totalBookings: 520,
      completedBookings: 485,
      cancelledBookings: 35,
      revenue: 425000,
      avgRating: 4.8,
      newClients: 145,
      repeatClients: 340,
    },
  };

  const data = analyticsData[selectedPeriod];

  // Chart data for bar visualization
  const weeklyData = [
    { day: 'Mon', value: 5 },
    { day: 'Tue', value: 8 },
    { day: 'Wed', value: 12 },
    { day: 'Thu', value: 7 },
    { day: 'Fri', value: 10 },
    { day: 'Sat', value: 15 },
    { day: 'Sun', value: 6 },
  ];

  const maxValue = Math.max(...weeklyData.map(d => d.value));

  const topServices = userRole === 'LOVER'
    ? [
        { name: 'Dog Walking', count: 25, percentage: 45 },
        { name: 'Pet Sitting', count: 12, percentage: 25 },
        { name: 'Overnight Stay', count: 8, percentage: 15 },
        { name: 'Day Care', count: 5, percentage: 10 },
        { name: 'Pet Meetup', count: 3, percentage: 5 },
      ]
    : [
        { name: userRole === 'VET' ? 'Consultation' : 'Full Grooming', count: 18, percentage: 40 },
        { name: userRole === 'VET' ? 'Vaccination' : 'Bath & Brush', count: 12, percentage: 25 },
        { name: userRole === 'VET' ? 'Dental Cleaning' : 'Nail Trimming', count: 8, percentage: 18 },
        { name: userRole === 'VET' ? 'Surgery' : 'De-shedding', count: 6, percentage: 12 },
        { name: userRole === 'VET' ? 'Follow-up' : 'Ear Cleaning', count: 4, percentage: 5 },
      ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <View style={{ width: 40 }} />
        </View>

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
              <Text style={styles.statValue}>{data.avgRating}</Text>
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
              <Ionicons name="trending-up" size={18} color="#10B981" />
              <Text style={styles.revenueChangeText}>+18% from last {selectedPeriod}</Text>
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
              <Text style={styles.clientStatValue}>{data.avgRating}</Text>
              <Text style={styles.clientStatLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Top Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top {userRole === 'LOVER' ? 'Services' : 'Services'}</Text>
          <View style={styles.servicesCard}>
            {topServices.map((service, index) => (
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
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
