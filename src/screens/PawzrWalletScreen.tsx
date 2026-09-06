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
import { colors, roleColors } from '../theme/colors';
import ComingSoonPanel from '../components/ComingSoonPanel';

// Wallet/Subscription/Earnings render honest placeholders until real payment
// APIs exist (Wave 0 scope decision). The old mock balances, transactions,
// rewards, and loyalty dashboards were deleted in Wave 5 — they must not be
// reintroduced without a real payments backend.

export default function PawzrWalletScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isProvider = ['VET', 'GROOMER', 'SUPPLIER'].includes(userRole);
  const roleColor = roleColors[userRole as keyof typeof roleColors] || colors.primary;

  const [activeTab, setActiveTab] = useState<'wallet' | 'rewards' | 'loyalty' | 'earnings' | 'payouts' | 'analytics'>('wallet');
  const [providerTab, setProviderTab] = useState<'earnings' | 'payouts' | 'analytics'>('earnings');

  // Get role-specific title
  const getRoleTitle = () => {
    switch (userRole) {
      case 'VET': return 'Vet Earnings';
      case 'GROOMER': return 'Groomer Earnings';
      case 'SUPPLIER': return 'Supplier Earnings';
      default: return 'Pawzr Wallet';
    }
  };

  // Render different UI based on user role
  if (isProvider) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getRoleTitle()}</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={colors.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Provider Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, providerTab === 'earnings' && [styles.tabActive, { borderBottomColor: roleColor }]]}
            onPress={() => setProviderTab('earnings')}
          >
            <Ionicons
              name="cash-outline"
              size={20}
              color={providerTab === 'earnings' ? roleColor : colors.gray[500]}
            />
            <Text style={[styles.tabText, providerTab === 'earnings' && { color: roleColor }]}>
              Earnings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, providerTab === 'payouts' && [styles.tabActive, { borderBottomColor: roleColor }]]}
            onPress={() => setProviderTab('payouts')}
          >
            <Ionicons
              name="wallet-outline"
              size={20}
              color={providerTab === 'payouts' ? roleColor : colors.gray[500]}
            />
            <Text style={[styles.tabText, providerTab === 'payouts' && { color: roleColor }]}>
              Payouts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, providerTab === 'analytics' && [styles.tabActive, { borderBottomColor: roleColor }]]}
            onPress={() => setProviderTab('analytics')}
          >
            <Ionicons
              name="bar-chart-outline"
              size={20}
              color={providerTab === 'analytics' ? roleColor : colors.gray[500]}
            />
            <Text style={[styles.tabText, providerTab === 'analytics' && { color: roleColor }]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Wallet, payouts, and rewards have no payment backend yet. */}
          <ComingSoonPanel
            icon="cash-outline"
            title="Earnings & payouts"
            body="Payouts, bank transfers, and earnings reports are coming soon. Track your live numbers meanwhile in Orders and Calendar."
            color={roleColor}
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Owner/Lover UI
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pawzr Wallet</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'wallet' && styles.tabActive]}
          onPress={() => setActiveTab('wallet')}
        >
          <Ionicons
            name="wallet-outline"
            size={20}
            color={activeTab === 'wallet' ? '#F97316' : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'wallet' && styles.tabTextActive]}>
            Wallet
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
          onPress={() => setActiveTab('rewards')}
        >
          <Ionicons
            name="gift-outline"
            size={20}
            color={activeTab === 'rewards' ? '#F97316' : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
            Rewards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'loyalty' && styles.tabActive]}
          onPress={() => setActiveTab('loyalty')}
        >
          <Ionicons
            name="diamond-outline"
            size={20}
            color={activeTab === 'loyalty' ? '#F97316' : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'loyalty' && styles.tabTextActive]}>
            Loyalty
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Wallet, rewards, and loyalty have no payment backend yet. */}
        <ComingSoonPanel
          icon="wallet-outline"
          title={activeTab === 'wallet' ? 'Pawzr Wallet' : activeTab === 'rewards' ? 'Rewards' : 'Loyalty'}
          body="Balance, cashback, points, and redemptions are coming soon. Nothing shown here moves real money."
          color="#F97316"
        />

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  helpButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#F97316',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  tabTextActive: {
    color: '#F97316',
  },
  scrollContent: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#F97316',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceItemDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  walletAction: {
    alignItems: 'center',
  },
  walletActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  impactCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  impactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 2,
  },
  impactText: {
    fontSize: 13,
    color: '#B91C1C',
  },
  impactProgress: {},
  impactProgressBar: {
    height: 8,
    backgroundColor: '#FECACA',
    borderRadius: 4,
    marginBottom: 6,
  },
  impactProgressFill: {
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  impactProgressText: {
    fontSize: 12,
    color: '#B91C1C',
    textAlign: 'center',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '500',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: colors.gray[500],
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionDate: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: 2,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsInfo: {},
  pointsLabel: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D97706',
  },
  pointsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
    color: '#F59E0B',
  },
  redeemButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
  redeemButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  redeemButtonTextDisabled: {
    color: colors.gray[500],
  },
  referCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  referContent: {
    marginBottom: 14,
  },
  referTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 6,
  },
  referText: {
    fontSize: 13,
    color: '#C2410C',
    marginBottom: 12,
  },
  referCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F97316',
  },
  referCodeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  loyaltyStatusCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  loyaltyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loyaltyTierName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  loyaltyPoints: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: 20,
  },
  progressToNext: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: colors.gray[600],
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  tierCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tierInfo: {
    flex: 1,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  tierPoints: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  tierBenefits: {
    paddingLeft: 62,
  },
  tierBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tierBenefitText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  moreBenefits: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  earnCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  earnPoints: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '500',
  },

  // ==================== PROVIDER STYLES ====================
  providerStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  providerStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  providerStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 2,
  },
  providerStatLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
  payoutSummaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutItem: {},
  payoutLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 4,
  },
  payoutValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  bankAccount: {
    fontSize: 13,
    color: colors.gray[500],
  },
  scheduleCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginHorizontal: 16,
  },
  scheduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  scheduleAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  payoutHistoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  payoutHistoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  payoutHistoryInfo: {
    flex: 1,
  },
  payoutHistoryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 2,
  },
  payoutHistoryStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  payoutHistoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gray[900],
  },
  analyticsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  analyticsCardTitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 6,
  },
  analyticsCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analyticsCardSubtext: {
    fontSize: 12,
    color: colors.gray[400],
  },
  commissionCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  commissionItem: {},
  commissionLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  commissionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  commissionTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
  },
  commissionTipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  monthlyCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  monthlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  monthlyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  monthlyMonth: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  },
  monthlyStats: {
    alignItems: 'flex-end',
  },
  monthlyBookings: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 2,
  },
  monthlyEarnings: {
    fontSize: 16,
    fontWeight: '700',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tipsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipsInfo: {
    flex: 1,
  },
  tipsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B91C1C',
    marginBottom: 4,
  },
  tipsLabel: {
    fontSize: 13,
    color: '#991B1B',
  },
});
