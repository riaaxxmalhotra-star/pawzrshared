import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors, roleColors, getRoleColor } from '../theme/colors';
import { ordersApi, bookingsApi } from '../lib/api';
import { createOrGetChatThread, sendChatMessage } from '../lib/firebase';
import logger from '../lib/logger';

const { width } = Dimensions.get('window');

interface Customer {
  id: string;
  userId?: string;
  name: string;
  image?: string;
  phone: string; // Masked for privacy
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  lastVisitMs: number | null;
  status: 'active' | 'at_risk' | 'churned' | 'new';
  pets: { name: string; type: string }[];
  notes?: string;
}

interface InsightCard {
  id: string;
  type: 'revenue' | 'retention' | 'growth' | 'alert';
  title: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  icon: string;
}

interface OrderRecord {
  customerId: string;
  name: string;
  image?: string;
  phone: string;
  total: number;
  dateMs: number | null;
  dateLabel: string;
  petName?: string;
  petType?: string;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 5) return phone;
  return `•••••${digits.slice(-5)}`;
}

function relativeDate(dateMs: number | null, fallback: string): string {
  if (dateMs === null) return fallback;
  const diffDays = Math.floor((Date.now() - dateMs) / 86400000);
  if (diffDays < 0) return fallback;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return new Date(dateMs).toLocaleDateString();
}

export default function VendorCRMScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'VET').toUpperCase();
  const [activeTab, setActiveTab] = useState<'customers' | 'campaigns' | 'insights'>('customers');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'at_risk' | 'churned' | 'new'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const getRoleConfig = () => {
    const roleColor = getRoleColor(userRole);
    switch (userRole) {
      case 'VET':
        return { color: roleColor, title: 'Patients' };
      case 'GROOMER':
        return { color: roleColor, title: 'Clients' };
      case 'SUPPLIER':
        return { color: roleColor, title: 'Customers' };
      default:
        return { color: roleColor, title: 'Customers' };
    }
  };

  const config = getRoleConfig();

  // Customers are derived from real order/booking history — never fabricated.
  // Suppliers read orders; vets/groomers read bookings.
  const loadRecords = useCallback(async () => {
    setLoadError(null);
    try {
      const isSupplier = userRole === 'SUPPLIER';
      const data = isSupplier ? await ordersApi.getMyOrders() : await bookingsApi.getMyBookings();
      const list = data.orders || data.bookings || data.data || data || [];
      const normalized: OrderRecord[] = (Array.isArray(list) ? list : [])
        .map((o: any) => {
          const customerId = o?.customerId ?? o?.customer?.id ?? o?.user?.id;
          const name = o?.customerName ?? o?.customer?.name ?? o?.user?.name;
          if (!name) return null;
          const rawDate = o?.createdAt ?? o?.date;
          const parsed = typeof rawDate === 'string' ? new Date(rawDate).getTime() : NaN;
          const dateMs = Number.isNaN(parsed) ? null : parsed;
          return {
            customerId: String(customerId ?? name),
            name: String(name),
            image: o?.customerImage ?? o?.customer?.image,
            phone: maskPhone(String(o?.phone ?? o?.customer?.phone ?? o?.user?.phone ?? '')),
            total: Number(o?.total ?? o?.amount ?? o?.price ?? 0),
            dateMs,
            dateLabel: dateMs !== null ? relativeDate(dateMs, '') : String(o?.date ?? ''),
            petName: o?.petName ?? o?.pet?.name ?? (Array.isArray(o?.items) ? undefined : undefined),
            petType: o?.petType ?? o?.pet?.species,
          } as OrderRecord;
        })
        .filter((r): r is OrderRecord => r !== null);
      setRecords(normalized);
    } catch (error) {
      logger.error('Failed to load CRM data:', error);
      setRecords([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load customer data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRecords();
  };

  const customers: Customer[] = (() => {
    const groups = new Map<string, OrderRecord[]>();
    for (const r of records) {
      const list = groups.get(r.customerId) ?? [];
      list.push(r);
      groups.set(r.customerId, list);
    }
    const now = Date.now();
    return [...groups.entries()].map(([id, list]) => {
      const dated = list.map(r => r.dateMs).filter((d): d is number => d !== null);
      const last = dated.length > 0 ? Math.max(...dated) : null;
      const first = dated.length > 0 ? Math.min(...dated) : null;
      const daysSinceLast = last !== null ? Math.floor((now - last) / 86400000) : 999;
      const daysSinceFirst = first !== null ? Math.floor((now - first) / 86400000) : 999;
      const status: Customer['status'] =
        list.length === 1 && daysSinceFirst <= 7 ? 'new'
        : daysSinceLast <= 14 ? 'active'
        : daysSinceLast <= 45 ? 'at_risk' : 'churned';
      const first2 = list[0];
      return {
        id,
        userId: list[0].customerId,
        name: first2.name,
        image: first2.image,
        phone: first2.phone,
        totalBookings: list.length,
        totalSpent: list.reduce((s, r) => s + r.total, 0),
        lastVisit: relativeDate(last, first2.dateLabel || '—'),
        lastVisitMs: last,
        status,
        pets: list
          .filter(r => r.petName)
          .map(r => ({ name: r.petName as string, type: r.petType ?? 'Pet' }))
          .filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i),
      };
    });
  })();

  const insights: InsightCard[] = (() => {
    const revenue = records.reduce((s, r) => s + r.total, 0);
    const unique = new Set(records.map(r => r.customerId)).size;
    const repeat = customers.filter(c => c.totalBookings > 1).length;
    const monthAgo = Date.now() - 30 * 86400000;
    const newCount = customers.filter(c => {
      const first = Math.min(...records.filter(r => r.customerId === c.id).map(r => r.dateMs ?? Infinity));
      return first >= monthAgo;
    }).length;
    const atRisk = customers.filter(c => c.status === 'at_risk' || c.status === 'churned').length;
    return [
      { id: 'INS001', type: 'revenue', title: 'Total Revenue', value: `₹${revenue.toLocaleString()}`, change: `${records.length} orders`, changeType: 'neutral', icon: 'cash' },
      { id: 'INS002', type: 'retention', title: 'Repeat Customers', value: `${repeat}`, change: `${unique} total customers`, changeType: 'neutral', icon: 'refresh' },
      { id: 'INS003', type: 'growth', title: 'New (30 days)', value: `${newCount}`, change: 'this month', changeType: 'neutral', icon: 'people' },
      { id: 'INS004', type: 'alert', title: 'Needs Attention', value: `${atRisk}`, change: 'at risk or churned', changeType: 'neutral', icon: 'warning' },
    ];
  })();

  const loyalCustomers = customers.filter(c => c.totalBookings >= 10);
  const atRiskCustomers = customers.filter(c => c.status === 'at_risk');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'at_risk': return '#F59E0B';
      case 'churned': return '#EF4444';
      case 'new': return '#3B82F6';
      default: return colors.gray[500];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'at_risk': return 'At Risk';
      case 'churned': return 'Churned';
      case 'new': return 'New';
      default: return status;
    }
  };

  const filteredCustomers = selectedFilter === 'all'
    ? customers
    : customers.filter(c => c.status === selectedFilter);

  // Handler functions for CRM actions
  const handleMessage = (customer: Customer) => {
    setSelectedCustomer(customer);
    setMessageText('');
    setMessageModalVisible(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedCustomer || sendingMessage) return;
    const customerId = selectedCustomer.userId;
    if (!user?.id || !customerId) {
      Alert.alert('Cannot message', 'Messaging is only available for customers with an account.');
      return;
    }
    setSendingMessage(true);
    try {
      const threadId = await createOrGetChatThread(
        user.id, user.name || 'User', user.image || '',
        customerId, selectedCustomer.name, selectedCustomer.image || ''
      );
      await sendChatMessage(threadId, user.id, user.name || 'User', messageText.trim(), 'text');
      Alert.alert('Message Sent', `Your message has been sent to ${selectedCustomer.name}.`);
      setMessageModalVisible(false);
      setMessageText('');
      setSelectedCustomer(null);
    } catch (error) {
      logger.error('CRM message failed:', error);
      Alert.alert('Message failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Render Message Modal
  const renderMessageModal = () => (
    <Modal
      visible={messageModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setMessageModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Message {selectedCustomer?.name}
            </Text>
            <TouchableOpacity onPress={() => setMessageModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {selectedCustomer?.pets && selectedCustomer.pets.length > 0 && (
              <View style={styles.petInfo}>
                <Ionicons name="paw" size={16} color={config.color} />
                <Text style={styles.petInfoText}>
                  About: {selectedCustomer.pets.map(p => p.name).join(', ')}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.gray[400]}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              numberOfLines={4}
            />

            <View style={styles.quickReplies}>
              <Text style={styles.quickRepliesLabel}>Quick replies:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => setMessageText("Hi! Just checking in. How is your pet doing?")}
                >
                  <Text style={styles.quickReplyText}>Check in</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => setMessageText("Time for your pet's regular checkup! Would you like to book an appointment?")}
                >
                  <Text style={styles.quickReplyText}>Reminder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickReplyChip}
                  onPress={() => setMessageText("Thank you for visiting us! We hope your pet is doing well.")}
                >
                  <Text style={styles.quickReplyText}>Thank you</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: config.color }, (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
            <Text style={styles.sendButtonText}>{sendingMessage ? 'Sending...' : 'Send Message'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCustomersTab = () => (
    <>
      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
        {['all', 'active', 'at_risk', 'churned', 'new'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && { backgroundColor: config.color },
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && { color: colors.white },
            ]}>
              {filter === 'all' ? 'All' : getStatusLabel(filter)}
            </Text>
            <View style={[
              styles.filterBadge,
              selectedFilter === filter && { backgroundColor: 'rgba(255,255,255,0.3)' },
            ]}>
              <Text style={[
                styles.filterBadgeText,
                selectedFilter === filter && { color: colors.white },
              ]}>
                {filter === 'all' ? customers.length : customers.filter(c => c.status === filter).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Customer List */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={config.color} />
          <Text style={styles.centerStateText}>Loading customers...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.centerStateTitle}>Could not load customers</Text>
          <Text style={styles.centerStateText}>{loadError}</Text>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: config.color, marginTop: 16 }]}
            onPress={() => { setLoading(true); loadRecords(); }}
          >
            <Text style={styles.sendButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="people-outline" size={48} color={colors.gray[300]} />
          <Text style={styles.centerStateTitle}>No customers yet</Text>
          <Text style={styles.centerStateText}>
            {customers.length === 0
              ? 'Customers will appear here after your first order or booking.'
              : 'No customers match this filter.'}
          </Text>
        </View>
      ) : (
      filteredCustomers.map((customer) => (
        <TouchableOpacity key={customer.id} style={styles.customerCard} activeOpacity={0.8}>
          <View style={styles.customerHeader}>
            {customer.image ? (
              <Image source={{ uri: customer.image }} style={styles.customerImage} />
            ) : (
              <View style={[styles.customerImagePlaceholder, { backgroundColor: config.color }]}>
                <Text style={styles.customerInitial}>{customer.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.customerInfo}>
              <View style={styles.customerNameRow}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(customer.status)}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(customer.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(customer.status) }]}>
                    {getStatusLabel(customer.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.customerPhone}>{customer.phone} • Last: {customer.lastVisit}</Text>
              <View style={styles.petTags}>
                {customer.pets.map((pet, idx) => (
                  <View key={idx} style={styles.petTag}>
                    <Ionicons name="paw" size={12} color={config.color} />
                    <Text style={styles.petTagText}>{pet.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.customerStats}>
            <View style={styles.customerStat}>
              <Text style={styles.customerStatValue}>{customer.totalBookings}</Text>
              <Text style={styles.customerStatLabel}>Bookings</Text>
            </View>
            <View style={styles.customerStatDivider} />
            <View style={styles.customerStat}>
              <Text style={styles.customerStatValue}>₹{customer.totalSpent.toLocaleString()}</Text>
              <Text style={styles.customerStatLabel}>Total Spent</Text>
            </View>
            <View style={styles.customerStatDivider} />
            <View style={styles.customerStat}>
              <Text style={styles.customerStatValue}>₹{Math.round(customer.totalSpent / customer.totalBookings).toLocaleString()}</Text>
              <Text style={styles.customerStatLabel}>Avg Value</Text>
            </View>
          </View>

          {customer.notes && (
            <View style={styles.noteCard}>
              <Ionicons name="document-text-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.noteText}>{customer.notes}</Text>
            </View>
          )}

          <View style={styles.customerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: `${config.color}15`, flex: 1 }]}
              onPress={() => handleMessage(customer)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={config.color} />
              <Text style={[styles.actionButtonText, { color: config.color }]}>Message</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )))}
    </>
  );

  const renderCampaignsTab = () => (
    <View style={styles.centerState}>
      <Ionicons name="megaphone-outline" size={48} color={colors.gray[300]} />
      <Text style={styles.centerStateTitle}>Campaigns coming soon</Text>
      <Text style={styles.centerStateText}>
        Automated welcome messages, reminders, and win-back offers are not available yet.
        Message customers directly from the Customers tab meanwhile.
      </Text>
    </View>
  );

  const renderInsightsTab = () => (
    <>
      {/* Insight Cards */}
      <View style={styles.insightsGrid}>
        {insights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <View style={[
              styles.insightIcon,
              {
                backgroundColor: insight.type === 'alert' ? '#FEF3C715' :
                  insight.type === 'revenue' ? '#D1FAE515' :
                  insight.type === 'retention' ? '#DBEAFE15' : '#EDE9FE15'
              }
            ]}>
              <Ionicons
                name={insight.icon as any}
                size={20}
                color={
                  insight.type === 'alert' ? '#F59E0B' :
                  insight.type === 'revenue' ? '#10B981' :
                  insight.type === 'retention' ? '#3B82F6' : '#8B5CF6'
                }
              />
            </View>
            <Text style={styles.insightValue}>{insight.value}</Text>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <View style={[
              styles.insightChange,
              {
                backgroundColor: insight.changeType === 'up' ? '#D1FAE5' :
                  insight.changeType === 'down' ? '#FEE2E2' : '#FEF3C7'
              }
            ]}>
              {insight.changeType === 'up' && <Ionicons name="trending-up" size={12} color="#10B981" />}
              {insight.changeType === 'down' && <Ionicons name="trending-down" size={12} color="#EF4444" />}
              <Text style={[
                styles.insightChangeText,
                {
                  color: insight.changeType === 'up' ? '#10B981' :
                    insight.changeType === 'down' ? '#EF4444' : '#D97706'
                }
              ]}>
                {insight.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Key Metrics */}
      <Text style={styles.sectionTitle}>Key Metrics</Text>
      <View style={styles.metricCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Average Booking Value</Text>
          <Text style={styles.metricValue}>
            ₹{records.length === 0 ? 0 : Math.round(records.reduce((s, r) => s + r.total, 0) / records.length).toLocaleString()}
          </Text>
        </View>
        <View style={styles.metricBar}>
          <View style={[styles.metricBarFill, { width: '75%', backgroundColor: config.color }]} />
        </View>
      </View>
      <View style={styles.metricCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Customer Lifetime Value</Text>
          <Text style={styles.metricValue}>
            ₹{customers.length === 0 ? 0 : Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length).toLocaleString()}
          </Text>
        </View>
        <View style={styles.metricBar}>
          <View style={[styles.metricBarFill, { width: '60%', backgroundColor: '#10B981' }]} />
        </View>
      </View>
      <View style={styles.metricCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Repeat Customer Rate</Text>
          <Text style={styles.metricValue}>
            {customers.length === 0 ? 0 : Math.round((customers.filter(c => c.totalBookings > 1).length / customers.length) * 100)}%
          </Text>
        </View>
        <View style={styles.metricBar}>
          <View style={[styles.metricBarFill, { width: '42%', backgroundColor: '#F59E0B' }]} />
        </View>
      </View>

      {/* Recommendations */}
      <Text style={styles.sectionTitle}>Recommendations</Text>
      {atRiskCustomers.length > 0 && (
      <View style={styles.recommendationCard}>
        <View style={[styles.recommendationIcon, { backgroundColor: '#FEF3C715' }]}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
        </View>
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationTitle}>Send Reminder to At-Risk Customers</Text>
          <Text style={styles.recommendationText}>
            {atRiskCustomers.length} customer{atRiskCustomers.length > 1 ? 's haven' : ' has'}n't visited in 2+ weeks. A quick message could bring them back.
          </Text>
        </View>
      </View>
      )}
      {loyalCustomers.length > 0 && (
      <View style={styles.recommendationCard}>
        <View style={[styles.recommendationIcon, { backgroundColor: '#D1FAE515' }]}>
          <Ionicons name="gift" size={20} color="#10B981" />
        </View>
        <View style={styles.recommendationContent}>
          <Text style={styles.recommendationTitle}>Loyal Customers</Text>
          <Text style={styles.recommendationText}>
            {loyalCustomers.length} customer{loyalCustomers.length > 1 ? 's have' : ' has'} 10+ bookings. A thank-you message goes a long way!
          </Text>
        </View>
      </View>
      )}
      {atRiskCustomers.length === 0 && loyalCustomers.length === 0 && (
        <Text style={styles.emptyInsightsText}>
          Personalized recommendations will appear here once you have more customer history.
        </Text>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modals */}
      {renderMessageModal()}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CRM Dashboard</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && { borderBottomColor: config.color }]}
          onPress={() => setActiveTab('customers')}
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={activeTab === 'customers' ? config.color : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'customers' && { color: config.color }]}>
            {config.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'campaigns' && { borderBottomColor: config.color }]}
          onPress={() => setActiveTab('campaigns')}
        >
          <Ionicons
            name="megaphone-outline"
            size={20}
            color={activeTab === 'campaigns' ? config.color : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'campaigns' && { color: config.color }]}>
            Campaigns
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && { borderBottomColor: config.color }]}
          onPress={() => setActiveTab('insights')}
        >
          <Ionicons
            name="analytics-outline"
            size={20}
            color={activeTab === 'insights' ? config.color : colors.gray[500]}
          />
          <Text style={[styles.tabText, activeTab === 'insights' && { color: config.color }]}>
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.color} />
        }
      >
        {activeTab === 'customers' && renderCustomersTab()}
        {activeTab === 'campaigns' && renderCampaignsTab()}
        {activeTab === 'insights' && renderInsightsTab()}

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
  emptyInsightsText: {
    fontSize: 14,
    color: colors.gray[500],
    fontStyle: 'italic',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  settingsButton: {
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
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  scrollContent: {
    padding: 16,
  },
  filterTabs: {
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    gap: 6,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.gray[600],
  },
  filterBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[700],
  },
  customerCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  customerImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  customerImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  customerInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerPhone: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 8,
  },
  petTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  petTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  petTagText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  customerStats: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  customerStat: {
    flex: 1,
    alignItems: 'center',
  },
  customerStatDivider: {
    width: 1,
    backgroundColor: colors.gray[200],
  },
  customerStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  customerStatLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  campaignHeader: {
    marginBottom: 20,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 6,
  },
  campaignSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  campaignCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  campaignInfo: {
    marginBottom: 12,
  },
  campaignNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  campaignName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  campaignToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  campaignToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  campaignDescription: {
    fontSize: 13,
    color: colors.gray[600],
  },
  campaignStats: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    padding: 10,
  },
  campaignStat: {
    flex: 1,
    alignItems: 'center',
  },
  campaignStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
  },
  campaignStatLabel: {
    fontSize: 11,
    color: colors.gray[500],
  },
  proFeatureCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  proFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  proFeatureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B21B6',
  },
  proFeatureText: {
    fontSize: 13,
    color: '#6D28D9',
    lineHeight: 18,
    marginBottom: 14,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 10,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  insightCard: {
    width: (width - 42) / 2,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  insightTitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  insightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  insightChangeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 12,
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 14,
    color: colors.gray[700],
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  metricBar: {
    height: 6,
    backgroundColor: colors.gray[100],
    borderRadius: 3,
  },
  metricBarFill: {
    height: 6,
    borderRadius: 3,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  recommendationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: colors.gray[600],
    lineHeight: 16,
  },
  recommendationAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
  },
  modalBody: {
    padding: 20,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.gray[50],
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  petInfoText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  messageInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.gray[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  quickReplies: {
    marginTop: 16,
  },
  quickRepliesLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 8,
  },
  quickReplyChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickReplyText: {
    fontSize: 13,
    color: colors.gray[700],
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: 10,
  },
  discountRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  discountChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  discountChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[700],
  },
  offerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  offerPreviewText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  timeSlots: {
    gap: 8,
    marginBottom: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.gray[50],
    padding: 14,
    borderRadius: 12,
  },
  timeSlotText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray[900],
  },
  customTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  customTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
