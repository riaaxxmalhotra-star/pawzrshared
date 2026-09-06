import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

interface EarningTx {
  id: string;
  amount: number;
  description: string;
  date: string;
  dateMs: number | null;
  status: 'completed' | 'pending';
}

const PERIOD_DAYS = { week: 7, month: 30, year: 365 } as const;

function displayDate(value: unknown): string {
  if (typeof value !== 'string' || value === '') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

  const [transactions, setTransactions] = useState<EarningTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Earnings are derived from real completed/pending bookings. There is no
  // payout backend, so withdrawals are honestly ₹0 with a coming-soon note —
  // never fabricated withdrawal history.
  const loadEarnings = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await bookingsApi.getMyBookings();
      const list = data.bookings || data || [];
      setTransactions(
        (Array.isArray(list) ? list : [])
          .map((b: any, index: number) => {
            const rawDate = b?.date ?? b?.createdAt;
            const parsed = typeof rawDate === 'string' ? new Date(rawDate).getTime() : NaN;
            const status = b?.status === 'completed' ? 'completed' : 'pending';
            return {
              id: String(b?.id ?? b?._id ?? index),
              amount: Number(b?.price ?? b?.total ?? b?.amount ?? 0),
              description: [b?.service ?? b?.serviceName, b?.petName ?? b?.pet?.name]
                .filter(Boolean).join(' - ') || 'Booking',
              date: displayDate(rawDate),
              dateMs: Number.isNaN(parsed) ? null : parsed,
              status,
            } as EarningTx;
          })
      );
    } catch (error) {
      logger.error('Failed to load earnings:', error);
      setTransactions([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load earnings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const windowStart = Date.now() - PERIOD_DAYS[selectedPeriod] * 86400000;
  const inWindow = transactions.filter(t => t.dateMs !== null && (t.dateMs as number) >= windowStart);
  const data = {
    total: inWindow.reduce((s, t) => s + t.amount, 0),
    pending: inWindow.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0),
    completed: inWindow.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0),
    withdrawn: 0,
    transactions: inWindow,
  };
  const availableBalance = data.completed - data.withdrawn;

  const handleWithdraw = () => {
    Alert.alert(
      'Payouts coming soon',
      'Withdrawals to bank/UPI are not available yet. Your cleared earnings are tracked here and will be payable once payouts launch.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadEarnings(); }} tintColor={config.color} />
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
            <Text style={styles.centerStateText}>Loading earnings...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerState}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.centerStateTitle}>Could not load earnings</Text>
            <Text style={styles.centerStateText}>{loadError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: config.color }]}
              onPress={() => { setLoading(true); loadEarnings(); }}
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

        {/* Balance Card */}
        <View style={styles.section}>
          <View style={[styles.balanceCard, { backgroundColor: config.color }]}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>₹{availableBalance.toLocaleString()}</Text>
            <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
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

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions</Text>
          </View>
          {data.transactions.length === 0 ? (
            <Text style={styles.emptyTxText}>No earnings in this period yet.</Text>
          ) : (
          data.transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={[styles.txIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="arrow-down" size={20} color="#10B981" />
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
              <Text style={[styles.txAmount, { color: '#10B981' }]}>
                +₹{tx.amount.toLocaleString()}
              </Text>
            </View>
          )))}
        </View>

        {/* Withdrawal History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Withdrawal Summary</Text>
          <View style={styles.withdrawalCard}>
            <View style={styles.withdrawalRow}>
              <Text style={styles.withdrawalLabel}>Total Withdrawn</Text>
              <Text style={styles.withdrawalValue}>₹0</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.payoutNote}>
              Payouts to bank/UPI are coming soon. Cleared earnings above are tracked and will be payable on launch.
            </Text>
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
  payoutNote: {
    fontSize: 13,
    color: colors.gray[500],
    lineHeight: 18,
    fontStyle: 'italic',
  },
  emptyTxText: {
    fontSize: 14,
    color: colors.gray[500],
    fontStyle: 'italic',
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
  divider: {
    height: 1,
    backgroundColor: colors.gray[100],
  },
});
