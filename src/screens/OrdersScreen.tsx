import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customerName: string;
  customerImage?: string;
  customerId: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
  phone: string;
  isRepeatCustomer?: boolean;
  visitCount?: number;
}

interface RepeatCustomer {
  id: string;
  name: string;
  image?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  loyaltyScore: number;
}

interface RetentionAlert {
  id: string;
  type: 'at_risk' | 'lost' | 'declining';
  message: string;
  customerCount: number;
  suggestion: string;
  icon: string;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerName: 'Rahul Kumar',
    customerId: 'CUS001',
    customerImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    items: [
      { name: 'Premium Dog Food 5kg', quantity: 2, price: 1200 },
      { name: 'Chew Toys Set', quantity: 1, price: 450 },
    ],
    total: 2850,
    status: 'pending',
    date: '2 mins ago',
    address: 'Koramangala, Bangalore',
    phone: '+91 98765 43210',
    isRepeatCustomer: true,
    visitCount: 5,
  },
  {
    id: 'ORD002',
    customerName: 'Priya Sharma',
    customerId: 'CUS002',
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    items: [
      { name: 'Cat Litter 10kg', quantity: 1, price: 800 },
    ],
    total: 800,
    status: 'confirmed',
    date: '1 hour ago',
    address: 'Indiranagar, Bangalore',
    phone: '+91 87654 32109',
    isRepeatCustomer: true,
    visitCount: 3,
  },
  {
    id: 'ORD005',
    customerName: 'Vikram Singh',
    customerId: 'CUS005',
    items: [
      { name: 'Bird Cage Large', quantity: 1, price: 3500 },
    ],
    total: 3500,
    status: 'pending',
    date: '30 mins ago',
    address: 'JP Nagar, Bangalore',
    phone: '+91 98761 23456',
  },
  {
    id: 'ORD003',
    customerName: 'Amit Patel',
    customerId: 'CUS003',
    items: [
      { name: 'Pet Grooming Kit', quantity: 1, price: 1500 },
      { name: 'Pet Shampoo', quantity: 2, price: 350 },
    ],
    total: 2200,
    status: 'shipped',
    date: 'Yesterday',
    address: 'HSR Layout, Bangalore',
    phone: '+91 76543 21098',
  },
  {
    id: 'ORD006',
    customerName: 'Sneha Reddy',
    customerId: 'CUS006',
    customerImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    items: [
      { name: 'Fish Tank 50L', quantity: 1, price: 4500 },
      { name: 'Fish Food Pack', quantity: 3, price: 200 },
    ],
    total: 5100,
    status: 'confirmed',
    date: '3 hours ago',
    address: 'Marathahalli, Bangalore',
    phone: '+91 87651 23098',
    isRepeatCustomer: true,
    visitCount: 8,
  },
  {
    id: 'ORD004',
    customerName: 'Neha Gupta',
    customerId: 'CUS004',
    customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    items: [
      { name: 'Dog Bed Large', quantity: 1, price: 2500 },
    ],
    total: 2500,
    status: 'delivered',
    date: '2 days ago',
    address: 'Whitefield, Bangalore',
    phone: '+91 65432 10987',
    isRepeatCustomer: true,
    visitCount: 12,
  },
];

// Mock repeat customers
const mockRepeatCustomers: RepeatCustomer[] = [
  {
    id: 'CUS004',
    name: 'Neha Gupta',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    totalOrders: 12,
    totalSpent: 28500,
    lastOrderDate: '2 days ago',
    loyaltyScore: 95,
  },
  {
    id: 'CUS006',
    name: 'Sneha Reddy',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    totalOrders: 8,
    totalSpent: 18200,
    lastOrderDate: '3 hours ago',
    loyaltyScore: 88,
  },
  {
    id: 'CUS001',
    name: 'Rahul Kumar',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    totalOrders: 5,
    totalSpent: 12400,
    lastOrderDate: '2 mins ago',
    loyaltyScore: 78,
  },
  {
    id: 'CUS002',
    name: 'Priya Sharma',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    totalOrders: 3,
    totalSpent: 4800,
    lastOrderDate: '1 hour ago',
    loyaltyScore: 65,
  },
];

// Mock retention alerts (anonymous - no customer names)
const mockRetentionAlerts: RetentionAlert[] = [
  {
    id: 'ALERT001',
    type: 'at_risk',
    message: '3 regular customers haven\'t ordered in 2+ weeks',
    customerCount: 3,
    suggestion: 'Send a personalized offer or check-in message',
    icon: 'warning',
  },
  {
    id: 'ALERT002',
    type: 'declining',
    message: '2 customers reduced their order frequency',
    customerCount: 2,
    suggestion: 'Consider loyalty rewards or exclusive deals',
    icon: 'trending-down',
  },
  {
    id: 'ALERT003',
    type: 'lost',
    message: '1 customer may have switched to another provider',
    customerCount: 1,
    suggestion: 'Win them back with a special comeback offer',
    icon: 'alert-circle',
  },
];

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const userRole = (user?.role || 'SUPPLIER').toUpperCase();
  const [selectedTab, setSelectedTab] = useState<'all' | OrderStatus>('all');
  const [activeSection, setActiveSection] = useState<'orders' | 'sales' | 'customers'>('orders');
  const [refreshing, setRefreshing] = useState(false);

  // Role-specific configuration
  const getRoleConfig = () => {
    switch (userRole) {
      case 'VET':
        return { color: '#10B981', title: 'Appointments', itemLabel: 'Consultation' };
      case 'GROOMER':
        return { color: '#8B5CF6', title: 'Bookings', itemLabel: 'Session' };
      case 'SUPPLIER':
      default:
        return { color: '#3B82F6', title: 'Orders', itemLabel: 'Order' };
    }
  };

  const config = getRoleConfig();

  const tabs: { key: 'all' | OrderStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: mockOrders.length },
    { key: 'pending', label: 'Pending', count: mockOrders.filter(o => o.status === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: mockOrders.filter(o => o.status === 'confirmed').length },
    { key: 'shipped', label: 'Shipped', count: mockOrders.filter(o => o.status === 'shipped').length },
    { key: 'delivered', label: 'Completed', count: mockOrders.filter(o => o.status === 'delivered').length },
  ];

  const filteredOrders = selectedTab === 'all'
    ? mockOrders
    : mockOrders.filter(order => order.status === selectedTab);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return colors.gray[500];
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'shipped': return 'car-outline';
      case 'delivered': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'ellipse-outline';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'at_risk': return '#F59E0B';
      case 'declining': return '#F97316';
      case 'lost': return '#EF4444';
      default: return colors.gray[500];
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // Calculate stats
  const stats = {
    pending: mockOrders.filter(o => o.status === 'pending').length,
    confirmed: mockOrders.filter(o => o.status === 'confirmed').length,
    shipped: mockOrders.filter(o => o.status === 'shipped').length,
    delivered: mockOrders.filter(o => o.status === 'delivered').length,
    totalRevenue: mockOrders.reduce((sum, o) => sum + o.total, 0),
    todayRevenue: mockOrders.filter(o => o.date.includes('mins') || o.date.includes('hour')).reduce((sum, o) => sum + o.total, 0),
    repeatCustomerRate: Math.round((mockOrders.filter(o => o.isRepeatCustomer).length / mockOrders.length) * 100),
    avgOrderValue: Math.round(mockOrders.reduce((sum, o) => sum + o.total, 0) / mockOrders.length),
  };

  const renderOrdersSection = () => (
    <>
      {/* Order Status Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <View style={styles.statHeader}>
            <Ionicons name="time" size={20} color="#D97706" />
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.pending}</Text>
          </View>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <View style={styles.statHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
            <Text style={[styles.statNumber, { color: '#2563EB' }]}>{stats.confirmed}</Text>
          </View>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EDE9FE' }]}>
          <View style={styles.statHeader}>
            <Ionicons name="car" size={20} color="#7C3AED" />
            <Text style={[styles.statNumber, { color: '#7C3AED' }]}>{stats.shipped}</Text>
          </View>
          <Text style={styles.statLabel}>Shipped</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <View style={styles.statHeader}>
            <Ionicons name="checkmark-done-circle" size={20} color="#059669" />
            <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.delivered}</Text>
          </View>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && { backgroundColor: config.color }]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextSelected]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, selectedTab === tab.key && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[styles.tabBadgeText, selectedTab === tab.key && { color: colors.white }]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={60} color={colors.gray[300]} />
          <Text style={styles.emptyTitle}>No {selectedTab} orders</Text>
          <Text style={styles.emptyText}>Orders will appear here when customers place them</Text>
        </View>
      ) : (
        filteredOrders.map((order) => (
          <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.8}>
            {/* Repeat Customer Badge */}
            {order.isRepeatCustomer && (
              <View style={styles.repeatBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.repeatBadgeText}>Repeat Customer ({order.visitCount}x)</Text>
              </View>
            )}

            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View style={styles.customerInfo}>
                {order.customerImage ? (
                  <Image source={{ uri: order.customerImage }} style={styles.customerImage} />
                ) : (
                  <View style={[styles.customerImagePlaceholder, { backgroundColor: config.color }]}>
                    <Text style={styles.customerInitial}>{order.customerName.charAt(0)}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                  <Text style={styles.orderDate}>{order.date}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}15` }]}>
                <Ionicons name={getStatusIcon(order.status) as any} size={14} color={getStatusColor(order.status)} />
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Order Items */}
            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString()}</Text>
                </View>
              ))}
            </View>

            {/* Order Footer */}
            <View style={styles.orderFooter}>
              <View style={styles.orderTotal}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>₹{order.total.toLocaleString()}</Text>
              </View>

              {order.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]}>
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}

              {order.status === 'confirmed' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}>
                  <Ionicons name="car-outline" size={16} color="#fff" />
                  <Text style={styles.shipBtnText}>Ship Now</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Order ID */}
            <Text style={styles.orderId}>Order #{order.id}</Text>
          </TouchableOpacity>
        ))
      )}
    </>
  );

  const renderSalesSection = () => (
    <>
      {/* Revenue Overview */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueHeader}>
          <Text style={styles.revenueSectionTitle}>Revenue Overview</Text>
          <View style={[styles.trendBadge, { backgroundColor: '#D1FAE515' }]}>
            <Ionicons name="trending-up" size={14} color="#10B981" />
            <Text style={styles.trendText}>+18%</Text>
          </View>
        </View>

        <View style={styles.revenueStats}>
          <View style={styles.revenueStat}>
            <Text style={styles.revenueAmount}>₹{stats.todayRevenue.toLocaleString()}</Text>
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueStat}>
            <Text style={styles.revenueAmount}>₹{stats.totalRevenue.toLocaleString()}</Text>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
          </View>
        </View>
      </View>

      {/* Sales Metrics */}
      <Text style={styles.sectionTitle}>Sales Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="receipt" size={24} color="#2563EB" />
          </View>
          <Text style={styles.metricValue}>{mockOrders.length}</Text>
          <Text style={styles.metricLabel}>Total Orders</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="cash" size={24} color="#D97706" />
          </View>
          <Text style={styles.metricValue}>₹{stats.avgOrderValue.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Avg Order Value</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="refresh" size={24} color="#059669" />
          </View>
          <Text style={styles.metricValue}>{stats.repeatCustomerRate}%</Text>
          <Text style={styles.metricLabel}>Repeat Rate</Text>
        </View>
        <View style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="people" size={24} color="#7C3AED" />
          </View>
          <Text style={styles.metricValue}>{mockRepeatCustomers.length}</Text>
          <Text style={styles.metricLabel}>Loyal Customers</Text>
        </View>
      </View>

      {/* Growth Tips */}
      <Text style={styles.sectionTitle}>Growth Tips</Text>
      <View style={styles.tipCard}>
        <View style={[styles.tipIcon, { backgroundColor: '#FEF3C715' }]}>
          <Ionicons name="bulb" size={24} color="#F59E0B" />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Boost Your Sales</Text>
          <Text style={styles.tipText}>Your repeat customer rate is {stats.repeatCustomerRate}%. Offer loyalty discounts to increase it to 50%+</Text>
        </View>
      </View>
      <View style={styles.tipCard}>
        <View style={[styles.tipIcon, { backgroundColor: '#DBEAFE15' }]}>
          <Ionicons name="megaphone" size={24} color="#2563EB" />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Promote Bestsellers</Text>
          <Text style={styles.tipText}>Premium Dog Food is your top seller. Feature it prominently in your listings!</Text>
        </View>
      </View>
    </>
  );

  const renderCustomersSection = () => (
    <>
      {/* Customer Retention Alerts */}
      <Text style={styles.sectionTitle}>
        <Ionicons name="notifications" size={16} color={colors.gray[700]} /> Retention Alerts
      </Text>
      {mockRetentionAlerts.map((alert) => (
        <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type) }]}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIconContainer, { backgroundColor: `${getAlertColor(alert.type)}15` }]}>
              <Ionicons name={alert.icon as any} size={20} color={getAlertColor(alert.type)} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertSuggestion}>{alert.suggestion}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.alertAction, { backgroundColor: getAlertColor(alert.type) }]}>
            <Text style={styles.alertActionText}>Take Action</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Repeat Customers */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        <Ionicons name="star" size={16} color="#F59E0B" /> Repeat Customers
      </Text>
      {mockRepeatCustomers.map((customer) => (
        <View key={customer.id} style={styles.customerCard}>
          <View style={styles.customerRow}>
            {customer.image ? (
              <Image source={{ uri: customer.image }} style={styles.customerAvatar} />
            ) : (
              <View style={[styles.customerAvatarPlaceholder, { backgroundColor: config.color }]}>
                <Text style={styles.customerAvatarText}>{customer.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.customerDetails}>
              <Text style={styles.customerCardName}>{customer.name}</Text>
              <Text style={styles.customerMeta}>{customer.totalOrders} orders • Last: {customer.lastOrderDate}</Text>
            </View>
            <View style={styles.loyaltyBadge}>
              <Ionicons name="heart" size={14} color="#EF4444" />
              <Text style={styles.loyaltyScore}>{customer.loyaltyScore}</Text>
            </View>
          </View>
          <View style={styles.customerStats}>
            <View style={styles.customerStatItem}>
              <Text style={styles.customerStatValue}>₹{customer.totalSpent.toLocaleString()}</Text>
              <Text style={styles.customerStatLabel}>Total Spent</Text>
            </View>
            <View style={styles.customerStatItem}>
              <Text style={styles.customerStatValue}>{customer.totalOrders}</Text>
              <Text style={styles.customerStatLabel}>Orders</Text>
            </View>
            <View style={styles.customerStatItem}>
              <Text style={styles.customerStatValue}>₹{Math.round(customer.totalSpent / customer.totalOrders).toLocaleString()}</Text>
              <Text style={styles.customerStatLabel}>Avg Order</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.rewardButton}>
            <Ionicons name="gift" size={16} color={config.color} />
            <Text style={[styles.rewardButtonText, { color: config.color }]}>Send Reward</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Anonymous Insight */}
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.insightTitle}>Privacy Protected Insights</Text>
        </View>
        <Text style={styles.insightText}>
          Customer identity is protected. You receive alerts when engagement drops,
          but never see where customers go. Focus on improving your service to retain them!
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.title}</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Section Tabs */}
      <View style={styles.sectionTabs}>
        <TouchableOpacity
          style={[styles.sectionTab, activeSection === 'orders' && { backgroundColor: config.color }]}
          onPress={() => setActiveSection('orders')}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeSection === 'orders' ? colors.white : colors.gray[600]}
          />
          <Text style={[styles.sectionTabText, activeSection === 'orders' && { color: colors.white }]}>
            Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionTab, activeSection === 'sales' && { backgroundColor: config.color }]}
          onPress={() => setActiveSection('sales')}
        >
          <Ionicons
            name="trending-up-outline"
            size={18}
            color={activeSection === 'sales' ? colors.white : colors.gray[600]}
          />
          <Text style={[styles.sectionTabText, activeSection === 'sales' && { color: colors.white }]}>
            Sales
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionTab, activeSection === 'customers' && { backgroundColor: config.color }]}
          onPress={() => setActiveSection('customers')}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={activeSection === 'customers' ? colors.white : colors.gray[600]}
          />
          <Text style={[styles.sectionTabText, activeSection === 'customers' && { color: colors.white }]}>
            Customers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.color} />
        }
      >
        {activeSection === 'orders' && renderOrdersSection()}
        {activeSection === 'sales' && renderSalesSection()}
        {activeSection === 'customers' && renderCustomersSection()}

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
  searchButton: {
    padding: 8,
  },
  sectionTabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
  },
  sectionTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[600],
  },
  scrollContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 42) / 2,
    padding: 14,
    borderRadius: 14,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 4,
  },
  tabsContainer: {
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  tabTextSelected: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  orderCard: {
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
  repeatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  repeatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  customerImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  orderDate: {
    fontSize: 13,
    color: colors.gray[500],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    color: colors.gray[700],
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {},
  totalLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectBtn: {
    backgroundColor: colors.gray[100],
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  shipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  orderId: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[900],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: 8,
  },
  // Sales Section Styles
  revenueCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  revenueSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  revenueStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueStat: {
    flex: 1,
    alignItems: 'center',
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  revenueLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  revenueDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray[200],
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
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
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  metricLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  // Customers Section Styles
  alertCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: 4,
  },
  alertSuggestion: {
    fontSize: 13,
    color: colors.gray[600],
  },
  alertAction: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  alertActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  customerCard: {
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
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  customerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  customerDetails: {
    flex: 1,
  },
  customerCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  },
  customerMeta: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loyaltyScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  customerStats: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  customerStatItem: {
    flex: 1,
    alignItems: 'center',
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
  rewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  rewardButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  insightText: {
    fontSize: 13,
    color: '#15803D',
    lineHeight: 20,
  },
});
