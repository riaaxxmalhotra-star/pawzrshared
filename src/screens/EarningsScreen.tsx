import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

export default function EarningsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return { color: '#10B981', title: 'Earnings' };
      case 'GROOMER':
        return { color: '#8B5CF6', title: 'Earnings' };
      case 'SUPPLIER':
        return { color: '#3B82F6', title: 'Revenue' };
      case 'LOVER':
        return { color: '#F97316', title: 'My Earnings' };
      default:
        return { color: colors.primary, title: 'Earnings' };
    }
  };

  const config = getRoleConfig();

  // Mock earnings data
  const earningsData = {
    week: {
      total: 8500,
      pending: 1200,
      completed: 7300,
      withdrawn: 5000,
      transactions: [
        { id: '1', type: 'credit', amount: 800, description: 'Dog Walking - Bruno', date: 'Today, 10:00 AM', status: 'completed' },
        { id: '2', type: 'credit', amount: 600, description: 'Pet Sitting - Whiskers', date: 'Today, 2:30 PM', status: 'pending' },
        { id: '3', type: 'debit', amount: 5000, description: 'Withdrawal to Bank', date: 'Yesterday', status: 'completed' },
        { id: '4', type: 'credit', amount: 1500, description: 'Overnight Stay - Max', date: '2 days ago', status: 'completed' },
      ],
    },
    month: {
      total: 35600,
      pending: 4800,
      completed: 30800,
      withdrawn: 25000,
      transactions: [
        { id: '1', type: 'credit', amount: 800, description: 'Dog Walking - Bruno', date: 'Today, 10:00 AM', status: 'completed' },
        { id: '2', type: 'credit', amount: 600, description: 'Pet Sitting - Whiskers', date: 'Today, 2:30 PM', status: 'pending' },
        { id: '3', type: 'debit', amount: 10000, description: 'Withdrawal to Bank', date: '3 days ago', status: 'completed' },
        { id: '4', type: 'credit', amount: 1500, description: 'Overnight Stay - Max', date: '5 days ago', status: 'completed' },
        { id: '5', type: 'credit', amount: 400, description: 'Pet Meetup - Coco', date: '1 week ago', status: 'completed' },
        { id: '6', type: 'debit', amount: 15000, description: 'Withdrawal to Bank', date: '2 weeks ago', status: 'completed' },
      ],
    },
    year: {
      total: 425000,
      pending: 12000,
      completed: 413000,
      withdrawn: 380000,
      transactions: [
        { id: '1', type: 'credit', amount: 800, description: 'Dog Walking - Bruno', date: 'Today, 10:00 AM', status: 'completed' },
        { id: '2', type: 'credit', amount: 600, description: 'Pet Sitting - Whiskers', date: 'Today, 2:30 PM', status: 'pending' },
        { id: '3', type: 'debit', amount: 50000, description: 'Withdrawal to Bank', date: 'This month', status: 'completed' },
        { id: '4', type: 'credit', amount: 35600, description: 'Monthly Earnings', date: 'Last month', status: 'completed' },
      ],
    },
  };

  const data = earningsData[selectedPeriod];
  const availableBalance = data.completed - data.withdrawn;

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

        {/* Balance Card */}
        <View style={styles.section}>
          <View style={[styles.balanceCard, { backgroundColor: config.color }]}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>₹{availableBalance.toLocaleString()}</Text>
            <TouchableOpacity style={styles.withdrawBtn}>
              <Ionicons name="wallet-outline" size={20} color={config.color} />
              <Text style={[styles.withdrawBtnText, { color: config.color }]}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${config.color}15` }]}>
                <Ionicons name="arrow-down" size={20} color={config.color} />
              </View>
              <Text style={styles.statValue}>₹{data.total.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="time" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>₹{data.pending.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>₹{data.completed.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Cleared</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity>
              <Text style={[styles.addText, { color: config.color }]}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.paymentCard}>
            <View style={styles.bankIcon}>
              <Ionicons name="card" size={24} color="#3B82F6" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>HDFC Bank</Text>
              <Text style={styles.paymentSubtitle}>****1234 • Savings</Text>
            </View>
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          </View>
          <View style={styles.paymentCard}>
            <View style={[styles.bankIcon, { backgroundColor: '#8B5CF615' }]}>
              <Ionicons name="phone-portrait" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>UPI</Text>
              <Text style={styles.paymentSubtitle}>{user?.email?.split('@')[0] || 'user'}@upi</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: config.color }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {data.transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View
                style={[
                  styles.txIcon,
                  { backgroundColor: tx.type === 'credit' ? '#10B98115' : '#EF444415' },
                ]}
              >
                <Ionicons
                  name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={20}
                  color={tx.type === 'credit' ? '#10B981' : '#EF4444'}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDescription}>{tx.description}</Text>
                <View style={styles.txMeta}>
                  <Text style={styles.txDate}>{tx.date}</Text>
                  {tx.status === 'pending' && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === 'credit' ? '#10B981' : '#EF4444' },
                ]}
              >
                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Withdrawal History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Summary</Text>
          <View style={styles.withdrawalCard}>
            <View style={styles.withdrawalRow}>
              <Text style={styles.withdrawalLabel}>Total Withdrawn</Text>
              <Text style={styles.withdrawalValue}>₹{data.withdrawn.toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.withdrawalRow}>
              <Text style={styles.withdrawalLabel}>Last Withdrawal</Text>
              <Text style={styles.withdrawalValue}>₹{(data.withdrawn / 5).toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.withdrawalRow}>
              <Text style={styles.withdrawalLabel}>Processing</Text>
              <Text style={[styles.withdrawalValue, { color: '#F59E0B' }]}>₹0</Text>
            </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.white,
    marginVertical: 8,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 16,
    gap: 8,
  },
  withdrawBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#3B82F615',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  paymentSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#10B98115',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  txDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  pendingBadge: {
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  withdrawalCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  withdrawalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  withdrawalLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  withdrawalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
});
