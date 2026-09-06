import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import ComingSoonPanel from '../components/ComingSoonPanel';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'reward' | 'cashback';
  title: string;
  description: string;
  amount: number;
  date: string;
  icon: string;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  category: string;
  image?: string;
  expiresIn?: string;
}

interface LoyaltyTier {
  name: string;
  icon: string;
  color: string;
  minPoints: number;
  benefits: string[];
}

// Role colors
const roleColors: Record<string, string> = {
  OWNER: '#F97316',
  LOVER: '#F97316',
  VET: '#10B981',
  GROOMER: '#8B5CF6',
  SUPPLIER: '#3B82F6',
};

// Mock transactions for Pet Owners/Lovers
const mockOwnerTransactions: Transaction[] = [
  {
    id: 'TXN001',
    type: 'cashback',
    title: 'Cashback Earned',
    description: 'Vet consultation at PetCare Clinic',
    amount: 120,
    date: 'Today',
    icon: 'arrow-down',
  },
  {
    id: 'TXN002',
    type: 'debit',
    title: 'Payment Made',
    description: 'Grooming at Happy Paws Salon',
    amount: -850,
    date: 'Yesterday',
    icon: 'arrow-up',
  },
  {
    id: 'TXN003',
    type: 'reward',
    title: 'Reward Earned',
    description: '5th booking bonus',
    amount: 200,
    date: '3 days ago',
    icon: 'gift',
  },
  {
    id: 'TXN004',
    type: 'credit',
    title: 'Wallet Top-up',
    description: 'Added via UPI',
    amount: 2000,
    date: '1 week ago',
    icon: 'add',
  },
  {
    id: 'TXN005',
    type: 'cashback',
    title: 'Referral Bonus',
    description: 'Friend joined Pawzr',
    amount: 100,
    date: '1 week ago',
    icon: 'people',
  },
];

// Mock transactions for Providers (Vets, Groomers, Suppliers)
interface ProviderTransaction {
  id: string;
  type: 'payment_received' | 'payout' | 'commission' | 'refund' | 'tip';
  title: string;
  description: string;
  amount: number;
  date: string;
  icon: string;
  customerName?: string;
  serviceName?: string;
}

const mockProviderTransactions: ProviderTransaction[] = [
  {
    id: 'PTXN001',
    type: 'payment_received',
    title: 'Payment Received',
    description: 'Consultation for Max (Golden Retriever)',
    amount: 1500,
    date: 'Today',
    icon: 'arrow-down',
    customerName: 'Priya S.',
    serviceName: 'Full Consultation',
  },
  {
    id: 'PTXN002',
    type: 'tip',
    title: 'Tip Received',
    description: 'From Rahul M.',
    amount: 200,
    date: 'Today',
    icon: 'heart',
    customerName: 'Rahul M.',
  },
  {
    id: 'PTXN003',
    type: 'commission',
    title: 'Platform Commission',
    description: '10% commission on booking',
    amount: -150,
    date: 'Yesterday',
    icon: 'remove',
  },
  {
    id: 'PTXN004',
    type: 'payout',
    title: 'Bank Payout',
    description: 'Weekly settlement to HDFC ****4521',
    amount: -8500,
    date: '3 days ago',
    icon: 'wallet',
  },
  {
    id: 'PTXN005',
    type: 'payment_received',
    title: 'Payment Received',
    description: 'Grooming for Luna (Persian Cat)',
    amount: 850,
    date: '4 days ago',
    icon: 'arrow-down',
    customerName: 'Amit K.',
    serviceName: 'Full Grooming',
  },
  {
    id: 'PTXN006',
    type: 'refund',
    title: 'Refund Issued',
    description: 'Cancelled appointment',
    amount: -500,
    date: '1 week ago',
    icon: 'refresh',
  },
];

// Provider earnings data
interface ProviderEarnings {
  availableBalance: number;
  pendingPayout: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  totalCommissionPaid: number;
  tipsReceived: number;
  completedBookings: number;
  cancelledBookings: number;
  avgRating: number;
  totalReviews: number;
}

const mockProviderEarnings: ProviderEarnings = {
  availableBalance: 12450,
  pendingPayout: 3200,
  totalEarnings: 85600,
  thisMonthEarnings: 18500,
  totalCommissionPaid: 8560,
  tipsReceived: 2450,
  completedBookings: 156,
  cancelledBookings: 3,
  avgRating: 4.8,
  totalReviews: 142,
};

// Mock rewards
const mockRewards: Reward[] = [
  {
    id: 'RWD001',
    title: 'Free Vet Consultation',
    description: 'One free consultation at any verified vet',
    pointsRequired: 500,
    category: 'health',
    expiresIn: '30 days',
  },
  {
    id: 'RWD002',
    title: '₹200 Off Grooming',
    description: 'Discount on any grooming service',
    pointsRequired: 300,
    category: 'grooming',
  },
  {
    id: 'RWD003',
    title: 'Premium Food Sample',
    description: 'Try premium pet food free',
    pointsRequired: 150,
    category: 'food',
  },
  {
    id: 'RWD004',
    title: 'Emergency Vet Access',
    description: 'Priority access for 30 days',
    pointsRequired: 1000,
    category: 'health',
    expiresIn: '60 days',
  },
];

// Loyalty tiers
const loyaltyTiers: LoyaltyTier[] = [
  {
    name: 'Pup',
    icon: 'paw',
    color: '#6B7280',
    minPoints: 0,
    benefits: ['Earn 1% cashback', 'Basic rewards'],
  },
  {
    name: 'Good Boy',
    icon: 'paw',
    color: '#F59E0B',
    minPoints: 500,
    benefits: ['Earn 2% cashback', 'Priority booking', 'Special offers'],
  },
  {
    name: 'Best Friend',
    icon: 'heart',
    color: '#F97316',
    minPoints: 2000,
    benefits: ['Earn 3% cashback', 'Free consultations', 'VIP support', 'Exclusive events'],
  },
  {
    name: 'Pawzr Elite',
    icon: 'diamond',
    color: '#8B5CF6',
    minPoints: 5000,
    benefits: ['Earn 5% cashback', 'All benefits', 'Personal concierge', 'Emergency priority'],
  },
];

export default function PawzrWalletScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const isProvider = ['VET', 'GROOMER', 'SUPPLIER'].includes(userRole);
  const roleColor = roleColors[userRole] || '#F97316';

  const [activeTab, setActiveTab] = useState<'wallet' | 'rewards' | 'loyalty' | 'earnings' | 'payouts' | 'analytics'>('wallet');
  const [providerTab, setProviderTab] = useState<'earnings' | 'payouts' | 'analytics'>('earnings');

  // Mock user wallet data (for owners/lovers)
  const walletData = {
    balance: 1420,
    pendingCashback: 180,
    totalEarned: 2850,
    points: 1250,
    tier: 'Good Boy',
    nextTier: 'Best Friend',
    pointsToNext: 750,
  };

  const currentTier = loyaltyTiers.find(t => t.name === walletData.tier) || loyaltyTiers[0];
  const nextTier = loyaltyTiers.find(t => t.name === walletData.nextTier);

  // Get role-specific title
  const getRoleTitle = () => {
    switch (userRole) {
      case 'VET': return 'Vet Earnings';
      case 'GROOMER': return 'Groomer Earnings';
      case 'SUPPLIER': return 'Supplier Earnings';
      default: return 'Pawzr Wallet';
    }
  };

  // Get transaction color for providers
  const getProviderTransactionColor = (type: string) => {
    switch (type) {
      case 'payment_received':
      case 'tip':
        return '#10B981';
      case 'payout':
        return '#3B82F6';
      case 'commission':
      case 'refund':
        return '#EF4444';
      default:
        return colors.gray[500];
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'cashback':
      case 'reward':
        return '#10B981';
      case 'debit':
        return '#EF4444';
      default:
        return colors.gray[500];
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return 'medkit';
      case 'grooming': return 'cut';
      case 'food': return 'restaurant';
      default: return 'gift';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'health': return '#10B981';
      case 'grooming': return '#8B5CF6';
      case 'food': return '#F59E0B';
      default: return '#F97316';
    }
  };

  // ==================== PROVIDER RENDER FUNCTIONS ====================

  const renderProviderEarningsTab = () => (
    <>
      {/* Earnings Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: roleColor }]}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="star" size={14} color="#fff" />
            <Text style={[styles.tierBadgeText, { color: '#fff' }]}>
              {mockProviderEarnings.avgRating} ({mockProviderEarnings.totalReviews})
            </Text>
          </View>
        </View>
        <Text style={styles.balanceAmount}>₹{mockProviderEarnings.availableBalance.toLocaleString()}</Text>

        <View style={styles.balanceDetails}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Pending Payout</Text>
            <Text style={[styles.balanceItemValue, { color: '#fff' }]}>₹{mockProviderEarnings.pendingPayout.toLocaleString()}</Text>
          </View>
          <View style={styles.balanceItemDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>This Month</Text>
            <Text style={[styles.balanceItemValue, { color: '#fff' }]}>₹{mockProviderEarnings.thisMonthEarnings.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.walletActions}>
          <TouchableOpacity style={styles.walletAction}>
            <View style={[styles.walletActionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="arrow-down" size={20} color="#fff" />
            </View>
            <Text style={styles.walletActionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletAction}>
            <View style={[styles.walletActionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="receipt-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.walletActionText}>Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletAction}>
            <View style={[styles.walletActionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="time-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.walletActionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.providerStatsRow}>
        <View style={styles.providerStatCard}>
          <View style={[styles.providerStatIcon, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          </View>
          <Text style={styles.providerStatValue}>{mockProviderEarnings.completedBookings}</Text>
          <Text style={styles.providerStatLabel}>Completed</Text>
        </View>
        <View style={styles.providerStatCard}>
          <View style={[styles.providerStatIcon, { backgroundColor: '#EF444415' }]}>
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </View>
          <Text style={styles.providerStatValue}>{mockProviderEarnings.cancelledBookings}</Text>
          <Text style={styles.providerStatLabel}>Cancelled</Text>
        </View>
        <View style={styles.providerStatCard}>
          <View style={[styles.providerStatIcon, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="heart" size={22} color="#F59E0B" />
          </View>
          <Text style={styles.providerStatValue}>₹{mockProviderEarnings.tipsReceived}</Text>
          <Text style={styles.providerStatLabel}>Tips</Text>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity>
          <Text style={[styles.seeAllText, { color: roleColor }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {mockProviderTransactions.map((txn) => (
        <View key={txn.id} style={styles.transactionCard}>
          <View style={[
            styles.transactionIcon,
            { backgroundColor: `${getProviderTransactionColor(txn.type)}15` }
          ]}>
            <Ionicons
              name={txn.icon as any}
              size={20}
              color={getProviderTransactionColor(txn.type)}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{txn.title}</Text>
            <Text style={styles.transactionDescription}>{txn.description}</Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.transactionAmountText,
              { color: getProviderTransactionColor(txn.type) }
            ]}>
              {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount).toLocaleString()}
            </Text>
            <Text style={styles.transactionDate}>{txn.date}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderProviderPayoutsTab = () => (
    <>
      {/* Payout Summary Card */}
      <View style={[styles.payoutSummaryCard, { borderColor: roleColor }]}>
        <View style={styles.payoutRow}>
          <View style={styles.payoutItem}>
            <Text style={styles.payoutLabel}>Available for Payout</Text>
            <Text style={[styles.payoutValue, { color: roleColor }]}>₹{mockProviderEarnings.availableBalance.toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={[styles.withdrawButton, { backgroundColor: roleColor }]}>
            <Ionicons name="arrow-down" size={18} color="#fff" />
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bank Account */}
      <Text style={styles.sectionTitle}>Linked Bank Account</Text>
      <View style={styles.bankCard}>
        <View style={styles.bankIcon}>
          <Ionicons name="card" size={24} color={roleColor} />
        </View>
        <View style={styles.bankInfo}>
          <Text style={styles.bankName}>HDFC Bank</Text>
          <Text style={styles.bankAccount}>Account ****4521</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={22} color={colors.gray[400]} />
        </TouchableOpacity>
      </View>

      {/* Payout Schedule */}
      <Text style={styles.sectionTitle}>Payout Schedule</Text>
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleItem}>
          <View style={[styles.scheduleIcon, { backgroundColor: `${roleColor}15` }]}>
            <Ionicons name="calendar" size={20} color={roleColor} />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleLabel}>Next Payout</Text>
            <Text style={styles.scheduleValue}>Monday, Feb 3</Text>
          </View>
          <Text style={[styles.scheduleAmount, { color: roleColor }]}>₹{mockProviderEarnings.pendingPayout.toLocaleString()}</Text>
        </View>
        <View style={styles.scheduleDivider} />
        <View style={styles.scheduleItem}>
          <View style={[styles.scheduleIcon, { backgroundColor: colors.gray[100] }]}>
            <Ionicons name="repeat" size={20} color={colors.gray[600]} />
          </View>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleLabel}>Payout Frequency</Text>
            <Text style={styles.scheduleValue}>Weekly (Every Monday)</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Payouts */}
      <Text style={styles.sectionTitle}>Recent Payouts</Text>
      {[
        { id: 1, date: 'Jan 27, 2026', amount: 8500, status: 'completed' },
        { id: 2, date: 'Jan 20, 2026', amount: 12300, status: 'completed' },
        { id: 3, date: 'Jan 13, 2026', amount: 6800, status: 'completed' },
      ].map((payout) => (
        <View key={payout.id} style={styles.payoutHistoryCard}>
          <View style={[styles.payoutHistoryIcon, { backgroundColor: '#3B82F615' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
          </View>
          <View style={styles.payoutHistoryInfo}>
            <Text style={styles.payoutHistoryDate}>{payout.date}</Text>
            <Text style={styles.payoutHistoryStatus}>Completed</Text>
          </View>
          <Text style={styles.payoutHistoryAmount}>₹{payout.amount.toLocaleString()}</Text>
        </View>
      ))}
    </>
  );

  const renderProviderAnalyticsTab = () => (
    <>
      {/* Total Earnings Overview */}
      <View style={[styles.analyticsCard, { borderLeftColor: roleColor }]}>
        <Text style={styles.analyticsCardTitle}>Total Earnings</Text>
        <Text style={[styles.analyticsCardValue, { color: roleColor }]}>₹{mockProviderEarnings.totalEarnings.toLocaleString()}</Text>
        <Text style={styles.analyticsCardSubtext}>Since joining Pawzr</Text>
      </View>

      {/* Commission Breakdown */}
      <Text style={styles.sectionTitle}>Commission Breakdown</Text>
      <View style={styles.commissionCard}>
        <View style={styles.commissionRow}>
          <View style={styles.commissionItem}>
            <Text style={styles.commissionLabel}>Total Commission Paid</Text>
            <Text style={[styles.commissionValue, { color: '#EF4444' }]}>₹{mockProviderEarnings.totalCommissionPaid.toLocaleString()}</Text>
          </View>
          <View style={styles.commissionItem}>
            <Text style={styles.commissionLabel}>Commission Rate</Text>
            <Text style={styles.commissionValue}>10%</Text>
          </View>
        </View>
        <View style={styles.commissionTip}>
          <Ionicons name="information-circle" size={18} color="#F59E0B" />
          <Text style={styles.commissionTipText}>
            Upgrade to Premium to reduce commission to 5%
          </Text>
        </View>
      </View>

      {/* Monthly Breakdown */}
      <Text style={styles.sectionTitle}>Monthly Performance</Text>
      <View style={styles.monthlyCard}>
        {[
          { month: 'Jan 2026', earnings: 18500, bookings: 32 },
          { month: 'Dec 2025', earnings: 22300, bookings: 38 },
          { month: 'Nov 2025', earnings: 15800, bookings: 28 },
          { month: 'Oct 2025', earnings: 14200, bookings: 25 },
        ].map((item, index) => (
          <View key={item.month} style={[styles.monthlyRow, index !== 3 && styles.monthlyRowBorder]}>
            <Text style={styles.monthlyMonth}>{item.month}</Text>
            <View style={styles.monthlyStats}>
              <Text style={styles.monthlyBookings}>{item.bookings} bookings</Text>
              <Text style={[styles.monthlyEarnings, { color: roleColor }]}>₹{item.earnings.toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Tips Summary */}
      <Text style={styles.sectionTitle}>Tips Received</Text>
      <View style={styles.tipsCard}>
        <View style={styles.tipsIcon}>
          <Ionicons name="heart" size={28} color="#EF4444" />
        </View>
        <View style={styles.tipsInfo}>
          <Text style={styles.tipsValue}>₹{mockProviderEarnings.tipsReceived.toLocaleString()}</Text>
          <Text style={styles.tipsLabel}>Total tips from happy customers</Text>
        </View>
      </View>
    </>
  );

  // ==================== OWNER/LOVER RENDER FUNCTIONS ====================

  const renderWalletTab = () => (
    <>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Pawzr Balance</Text>
          <View style={styles.tierBadge}>
            <Ionicons name={currentTier.icon as any} size={14} color={currentTier.color} />
            <Text style={[styles.tierBadgeText, { color: currentTier.color }]}>{currentTier.name}</Text>
          </View>
        </View>
        <Text style={styles.balanceAmount}>₹{walletData.balance.toLocaleString()}</Text>

        <View style={styles.balanceDetails}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Pending Cashback</Text>
            <Text style={[styles.balanceItemValue, { color: '#F59E0B' }]}>₹{walletData.pendingCashback}</Text>
          </View>
          <View style={styles.balanceItemDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Total Earned</Text>
            <Text style={[styles.balanceItemValue, { color: '#10B981' }]}>₹{walletData.totalEarned}</Text>
          </View>
        </View>

        <View style={styles.walletActions}>
          <TouchableOpacity style={styles.walletAction}>
            <View style={[styles.walletActionIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="add" size={20} color="#10B981" />
            </View>
            <Text style={styles.walletActionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletAction}>
            <View style={[styles.walletActionIcon, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="send" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.walletActionText}>Pay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletAction}>
            <View style={[styles.walletActionIcon, { backgroundColor: '#F5731615' }]}>
              <Ionicons name="time" size={20} color="#F97316" />
            </View>
            <Text style={styles.walletActionText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Impact Card */}
      <View style={styles.impactCard}>
        <View style={styles.impactHeader}>
          <View style={styles.impactIcon}>
            <Ionicons name="heart" size={20} color="#EF4444" />
          </View>
          <View style={styles.impactContent}>
            <Text style={styles.impactTitle}>Your Impact</Text>
            <Text style={styles.impactText}>Your bookings helped feed 12 rescued animals!</Text>
          </View>
        </View>
        <View style={styles.impactProgress}>
          <View style={styles.impactProgressBar}>
            <View style={[styles.impactProgressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.impactProgressText}>12/20 meals donated</Text>
        </View>
      </View>

      {/* Transactions */}
      <View style={styles.transactionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {mockOwnerTransactions.map((txn) => (
        <View key={txn.id} style={styles.transactionCard}>
          <View style={[
            styles.transactionIcon,
            { backgroundColor: `${getTransactionColor(txn.type)}15` }
          ]}>
            <Ionicons
              name={txn.icon as any}
              size={20}
              color={getTransactionColor(txn.type)}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{txn.title}</Text>
            <Text style={styles.transactionDescription}>{txn.description}</Text>
          </View>
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.transactionAmountText,
              { color: getTransactionColor(txn.type) }
            ]}>
              {txn.amount > 0 ? '+' : ''}₹{Math.abs(txn.amount)}
            </Text>
            <Text style={styles.transactionDate}>{txn.date}</Text>
          </View>
        </View>
      ))}
    </>
  );

  const renderRewardsTab = () => (
    <>
      {/* Points Balance */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsInfo}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          <Text style={styles.pointsValue}>{walletData.points.toLocaleString()}</Text>
        </View>
        <View style={styles.pointsIcon}>
          <Ionicons name="star" size={32} color="#F59E0B" />
        </View>
      </View>

      {/* Available Rewards */}
      <Text style={styles.sectionTitle}>Available Rewards</Text>
      {mockRewards.map((reward) => (
        <View key={reward.id} style={styles.rewardCard}>
          <View style={[
            styles.rewardIcon,
            { backgroundColor: `${getCategoryColor(reward.category)}15` }
          ]}>
            <Ionicons
              name={getCategoryIcon(reward.category) as any}
              size={24}
              color={getCategoryColor(reward.category)}
            />
          </View>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardTitle}>{reward.title}</Text>
            <Text style={styles.rewardDescription}>{reward.description}</Text>
            {reward.expiresIn && (
              <View style={styles.expiryBadge}>
                <Ionicons name="time-outline" size={12} color="#F59E0B" />
                <Text style={styles.expiryText}>Expires in {reward.expiresIn}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.redeemButton,
              walletData.points < reward.pointsRequired && styles.redeemButtonDisabled
            ]}
            disabled={walletData.points < reward.pointsRequired}
          >
            <Text style={[
              styles.redeemButtonText,
              walletData.points < reward.pointsRequired && styles.redeemButtonTextDisabled
            ]}>
              {reward.pointsRequired} pts
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Refer & Earn */}
      <View style={styles.referCard}>
        <View style={styles.referContent}>
          <Text style={styles.referTitle}>Invite Friends, Earn 100 Points!</Text>
          <Text style={styles.referText}>Share your code and get points when friends make their first booking.</Text>
          <View style={styles.referCode}>
            <Text style={styles.referCodeText}>PAWZR{user?.id?.slice(0, 4).toUpperCase() || 'XYZ1'}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={18} color="#F97316" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderLoyaltyTab = () => (
    <>
      {/* Current Status */}
      <View style={[styles.loyaltyStatusCard, { borderColor: currentTier.color }]}>
        <View style={[styles.loyaltyIcon, { backgroundColor: `${currentTier.color}15` }]}>
          <Ionicons name={currentTier.icon as any} size={32} color={currentTier.color} />
        </View>
        <Text style={[styles.loyaltyTierName, { color: currentTier.color }]}>{currentTier.name}</Text>
        <Text style={styles.loyaltyPoints}>{walletData.points.toLocaleString()} points</Text>

        {nextTier && (
          <View style={styles.progressToNext}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, (walletData.points / nextTier.minPoints) * 100)}%`,
                    backgroundColor: currentTier.color
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {walletData.pointsToNext} more points to {nextTier.name}
            </Text>
          </View>
        )}
      </View>

      {/* Current Benefits */}
      <Text style={styles.sectionTitle}>Your Benefits</Text>
      <View style={styles.benefitsCard}>
        {currentTier.benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <View style={[styles.benefitCheck, { backgroundColor: `${currentTier.color}15` }]}>
              <Ionicons name="checkmark" size={16} color={currentTier.color} />
            </View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      {/* All Tiers */}
      <Text style={styles.sectionTitle}>Loyalty Tiers</Text>
      {loyaltyTiers.map((tier, index) => {
        const isCurrentTier = tier.name === currentTier.name;
        const isAchieved = walletData.points >= tier.minPoints;

        return (
          <View
            key={tier.name}
            style={[
              styles.tierCard,
              isCurrentTier && { borderColor: tier.color, borderWidth: 2 },
            ]}
          >
            <View style={styles.tierHeader}>
              <View style={[styles.tierIcon, { backgroundColor: `${tier.color}15` }]}>
                <Ionicons name={tier.icon as any} size={24} color={tier.color} />
              </View>
              <View style={styles.tierInfo}>
                <View style={styles.tierNameRow}>
                  <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
                  {isCurrentTier && (
                    <View style={[styles.currentBadge, { backgroundColor: tier.color }]}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tierPoints}>{tier.minPoints.toLocaleString()}+ points</Text>
              </View>
              {isAchieved ? (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              ) : (
                <Ionicons name="lock-closed" size={24} color={colors.gray[300]} />
              )}
            </View>
            <View style={styles.tierBenefits}>
              {tier.benefits.slice(0, 2).map((benefit, idx) => (
                <View key={idx} style={styles.tierBenefitItem}>
                  <Ionicons name="star" size={12} color={tier.color} />
                  <Text style={styles.tierBenefitText}>{benefit}</Text>
                </View>
              ))}
              {tier.benefits.length > 2 && (
                <Text style={[styles.moreBenefits, { color: tier.color }]}>
                  +{tier.benefits.length - 2} more benefits
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {/* How to Earn */}
      <Text style={styles.sectionTitle}>How to Earn Points</Text>
      <View style={styles.earnCard}>
        <View style={styles.earnItem}>
          <View style={[styles.earnIcon, { backgroundColor: '#10B98115' }]}>
            <Ionicons name="calendar" size={20} color="#10B981" />
          </View>
          <View style={styles.earnInfo}>
            <Text style={styles.earnTitle}>Book Services</Text>
            <Text style={styles.earnPoints}>10 pts per ₹100 spent</Text>
          </View>
        </View>
        <View style={styles.earnItem}>
          <View style={[styles.earnIcon, { backgroundColor: '#3B82F615' }]}>
            <Ionicons name="star" size={20} color="#3B82F6" />
          </View>
          <View style={styles.earnInfo}>
            <Text style={styles.earnTitle}>Write Reviews</Text>
            <Text style={styles.earnPoints}>25 pts per review</Text>
          </View>
        </View>
        <View style={styles.earnItem}>
          <View style={[styles.earnIcon, { backgroundColor: '#F9731615' }]}>
            <Ionicons name="people" size={20} color="#F97316" />
          </View>
          <View style={styles.earnInfo}>
            <Text style={styles.earnTitle}>Refer Friends</Text>
            <Text style={styles.earnPoints}>100 pts per referral</Text>
          </View>
        </View>
        <View style={styles.earnItem}>
          <View style={[styles.earnIcon, { backgroundColor: '#EF444415' }]}>
            <Ionicons name="heart" size={20} color="#EF4444" />
          </View>
          <View style={styles.earnInfo}>
            <Text style={styles.earnTitle}>Donate to Shelters</Text>
            <Text style={styles.earnPoints}>50 pts per donation</Text>
          </View>
        </View>
      </View>
    </>
  );

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
          {/* Wallet, payouts, and rewards have no payment backend yet — the
              mock dashboards below are intentionally unreachable until the
              real payments build lands (Wave 0 scope decision). */}
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
        {/* Wallet, rewards, and loyalty have no payment backend yet — the
            mock dashboards below are intentionally unreachable until the
            real payments build lands (Wave 0 scope decision). */}
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
