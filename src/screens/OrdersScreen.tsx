import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customerName: string;
  customerImage?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
  phone: string;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: 'ORD001',
    customerName: 'Rahul Kumar',
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
  },
  {
    id: 'ORD002',
    customerName: 'Priya Sharma',
    customerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    items: [
      { name: 'Cat Litter 10kg', quantity: 1, price: 800 },
    ],
    total: 800,
    status: 'confirmed',
    date: '1 hour ago',
    address: 'Indiranagar, Bangalore',
    phone: '+91 87654 32109',
  },
  {
    id: 'ORD003',
    customerName: 'Amit Patel',
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
    id: 'ORD004',
    customerName: 'Neha Gupta',
    customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    items: [
      { name: 'Dog Bed Large', quantity: 1, price: 2500 },
    ],
    total: 2500,
    status: 'delivered',
    date: '2 days ago',
    address: 'Whitefield, Bangalore',
    phone: '+91 65432 10987',
  },
];

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'all' | OrderStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  const tabs: { key: 'all' | OrderStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const stats = {
    pending: mockOrders.filter(o => o.status === 'pending').length,
    total: mockOrders.reduce((sum, o) => sum + o.total, 0),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statNumber, { color: '#D97706' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>Rs.{stats.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabSelected]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextSelected]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>Orders will appear here when customers place them</Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderCard} activeOpacity={0.8}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.customerInfo}>
                  {order.customerImage ? (
                    <Image source={{ uri: order.customerImage }} style={styles.customerImage} />
                  ) : (
                    <View style={styles.customerImagePlaceholder}>
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
                    <Text style={styles.itemPrice}>Rs.{item.price * item.quantity}</Text>
                  </View>
                ))}
              </View>

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <View style={styles.orderTotal}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>Rs.{order.total.toLocaleString()}</Text>
                </View>

                {order.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]}>
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]}>
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {order.status === 'confirmed' && (
                  <TouchableOpacity style={[styles.actionBtn, styles.shipBtn]}>
                    <Ionicons name="car-outline" size={16} color="#fff" />
                    <Text style={styles.shipBtnText}>Mark as Shipped</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Order ID */}
              <Text style={styles.orderId}>Order #{order.id}</Text>
            </TouchableOpacity>
          ))
        )}

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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    color: colors.gray[600],
    marginTop: 4,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  tabSelected: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[600],
  },
  tabTextSelected: {
    color: colors.white,
  },
  scrollContent: {
    padding: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  customerImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
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
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
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
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  shipBtn: {
    backgroundColor: '#8B5CF6',
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
});
