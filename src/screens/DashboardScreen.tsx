import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/colors';
import { petsApi, bookingsApi, providersApi } from '../lib/api';

interface UpcomingBooking {
  id: string;
  providerName: string;
  service: string;
  date: string;
  time: string;
  type: 'vet' | 'groomer' | 'walker';
}

interface NearbyProvider {
  id: string;
  name: string;
  type: string;
  rating: number;
  distance: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const userRole = (user?.role || 'OWNER').toUpperCase();
  const providerRoles = ['VET', 'GROOMER', 'SUPPLIER', 'LOVER'];
  const isOwner = !providerRoles.includes(userRole);

  // Debug log
  console.log('DashboardScreen - user.role:', user?.role, 'userRole:', userRole, 'isOwner:', isOwner);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ petsCount: 0, bookingsCount: 0, messagesCount: 3 });
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProvider[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [petsData, bookingsData, vetsData, groomersData] = await Promise.all([
        petsApi.getMyPets().catch(() => ({ pets: [] })),
        bookingsApi.getMyBookings().catch(() => ({ bookings: [] })),
        providersApi.getVets().catch(() => ({ vets: [] })),
        providersApi.getGroomers().catch(() => ({ groomers: [] })),
      ]);

      setStats({
        petsCount: (petsData.pets || petsData || []).length,
        bookingsCount: (bookingsData.bookings || bookingsData || []).length,
        messagesCount: 3,
      });

      // Mock upcoming bookings
      setUpcomingBookings([
        { id: '1', providerName: 'Dr. Sarah', service: 'Annual Checkup', date: 'Tomorrow', time: '10:00 AM', type: 'vet' },
        { id: '2', providerName: 'PetSpa Studio', service: 'Full Grooming', date: 'Fri, Jan 17', time: '2:30 PM', type: 'groomer' },
      ]);

      // Combine providers
      const vets = (vetsData.vets || vetsData || []).slice(0, 2).map((v: any) => ({
        id: v.id,
        name: v.name || 'Vet',
        type: 'Veterinarian',
        rating: v.rating || 4.8,
        distance: v.distance || '1.2 km',
      }));
      const groomers = (groomersData.groomers || groomersData || []).slice(0, 2).map((g: any) => ({
        id: g.id,
        name: g.name || 'Groomer',
        type: 'Pet Groomer',
        rating: g.rating || 4.7,
        distance: g.distance || '0.8 km',
      }));

      setNearbyProviders([...vets, ...groomers].length > 0 ? [...vets, ...groomers] : [
        { id: '1', name: 'Dr. Amit Sharma', type: 'Veterinarian', rating: 4.9, distance: '0.5 km' },
        { id: '2', name: 'PetSpa Studio', type: 'Pet Groomer', rating: 4.8, distance: '1.2 km' },
        { id: '3', name: 'Happy Paws Clinic', type: 'Veterinarian', rating: 4.7, distance: '2.1 km' },
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Veterinarian':
        return 'medical';
      case 'Pet Groomer':
        return 'cut';
      default:
        return 'paw';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Veterinarian':
        return '#10B981';
      case 'Pet Groomer':
        return '#8B5CF6';
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Provider Dashboard
  const getProviderConfig = () => {
    switch (userRole) {
      case 'VET':
        return { icon: 'medical', color: '#10B981', title: 'Veterinarian', listingLabel: 'Services' };
      case 'GROOMER':
        return { icon: 'cut', color: '#8B5CF6', title: 'Pet Groomer', listingLabel: 'Services' };
      case 'SUPPLIER':
        return { icon: 'storefront', color: '#3B82F6', title: 'Supplier', listingLabel: 'Products' };
      case 'LOVER':
        return { icon: 'heart', color: '#EC4899', title: 'Pet Lover', listingLabel: 'Services' };
      default:
        return { icon: 'business', color: colors.primary, title: 'Provider', listingLabel: 'Listings' };
    }
  };

  // Supplier Dashboard
  if (userRole === 'SUPPLIER') {
    const supplierColor = '#3B82F6';

    // Mock data for supplier dashboard
    const salesData = {
      today: 4250,
      week: 28500,
      month: 127800,
      orders: { pending: 8, processing: 5, shipped: 12, delivered: 156 },
    };

    const topProducts = [
      { id: '1', name: 'Premium Dog Food', sales: 45, revenue: 58455, stock: 23 },
      { id: '2', name: 'Cat Scratching Post', sales: 32, revenue: 25600, stock: 8 },
      { id: '3', name: 'Pet Carrier Bag', sales: 28, revenue: 39200, stock: 15 },
    ];

    const recentOrders = [
      { id: 'ORD-2847', customer: 'Rahul Kumar', items: 3, total: 2450, status: 'pending', time: '10 min ago' },
      { id: 'ORD-2846', customer: 'Priya Sharma', items: 1, total: 899, status: 'processing', time: '25 min ago' },
      { id: 'ORD-2845', customer: 'Amit Patel', items: 5, total: 4200, status: 'shipped', time: '1 hour ago' },
      { id: 'ORD-2844', customer: 'Neha Gupta', items: 2, total: 1650, status: 'delivered', time: '3 hours ago' },
    ];

    const lowStockItems = [
      { id: '1', name: 'Cat Scratching Post', stock: 8, threshold: 10 },
      { id: '2', name: 'Dog Leash (Medium)', stock: 5, threshold: 15 },
      { id: '3', name: 'Bird Feed Premium', stock: 3, threshold: 20 },
    ];

    const getOrderStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return '#F59E0B';
        case 'processing': return '#3B82F6';
        case 'shipped': return '#8B5CF6';
        case 'delivered': return '#10B981';
        default: return colors.gray[500];
      }
    };

    const getOrderStatusIcon = (status: string) => {
      switch (status) {
        case 'pending': return 'time';
        case 'processing': return 'sync';
        case 'shipped': return 'car';
        case 'delivered': return 'checkmark-circle';
        default: return 'ellipse';
      }
    };

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={supplierColor} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'there'}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={24} color={colors.gray[700]} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Role Badge */}
          <View style={styles.roleBadgeContainer}>
            <View style={[styles.roleBadge, { backgroundColor: `${supplierColor}15` }]}>
              <Ionicons name="storefront" size={18} color={supplierColor} />
              <Text style={[styles.roleBadgeText, { color: supplierColor }]}>Supplier</Text>
            </View>
          </View>

          {/* Revenue Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Overview</Text>
            <View style={styles.revenueCard}>
              <View style={styles.revenueMain}>
                <Text style={styles.revenueLabel}>Today's Sales</Text>
                <Text style={[styles.revenueValue, { color: supplierColor }]}>₹{salesData.today.toLocaleString()}</Text>
                <View style={styles.revenueChange}>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                  <Text style={styles.revenueChangeText}>+12% from yesterday</Text>
                </View>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueSecondary}>
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueItemLabel}>This Week</Text>
                  <Text style={styles.revenueItemValue}>₹{(salesData.week / 1000).toFixed(1)}K</Text>
                </View>
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueItemLabel}>This Month</Text>
                  <Text style={styles.revenueItemValue}>₹{(salesData.month / 1000).toFixed(1)}K</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Order Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={styles.orderStatsGrid}>
              <View style={[styles.orderStatCard, { borderLeftColor: '#F59E0B' }]}>
                <Text style={styles.orderStatValue}>{salesData.orders.pending}</Text>
                <Text style={styles.orderStatLabel}>Pending</Text>
              </View>
              <View style={[styles.orderStatCard, { borderLeftColor: '#3B82F6' }]}>
                <Text style={styles.orderStatValue}>{salesData.orders.processing}</Text>
                <Text style={styles.orderStatLabel}>Processing</Text>
              </View>
              <View style={[styles.orderStatCard, { borderLeftColor: '#8B5CF6' }]}>
                <Text style={styles.orderStatValue}>{salesData.orders.shipped}</Text>
                <Text style={styles.orderStatLabel}>Shipped</Text>
              </View>
              <View style={[styles.orderStatCard, { borderLeftColor: '#10B981' }]}>
                <Text style={styles.orderStatValue}>{salesData.orders.delivered}</Text>
                <Text style={styles.orderStatLabel}>Delivered</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.providerActionsRow}>
              <TouchableOpacity style={styles.providerActionItem}>
                <View style={[styles.providerActionIcon, { backgroundColor: `${supplierColor}15` }]}>
                  <Ionicons name="add-circle" size={24} color={supplierColor} />
                </View>
                <Text style={styles.providerActionLabel}>Add Product</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.providerActionItem}>
                <View style={[styles.providerActionIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="receipt" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.providerActionLabel}>Orders</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.providerActionsRow}>
              <TouchableOpacity style={styles.providerActionItem}>
                <View style={[styles.providerActionIcon, { backgroundColor: '#8B5CF615' }]}>
                  <Ionicons name="cube" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.providerActionLabel}>Inventory</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.providerActionItem}>
                <View style={[styles.providerActionIcon, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="bar-chart" size={24} color="#10B981" />
                </View>
                <Text style={styles.providerActionLabel}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Orders */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: supplierColor }]}>View all</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.map((order) => (
              <TouchableOpacity key={order.id} style={styles.orderCard}>
                <View style={[styles.orderIcon, { backgroundColor: `${getOrderStatusColor(order.status)}15` }]}>
                  <Ionicons name={getOrderStatusIcon(order.status) as any} size={20} color={getOrderStatusColor(order.status)} />
                </View>
                <View style={styles.orderInfo}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <View style={[styles.orderStatusBadge, { backgroundColor: `${getOrderStatusColor(order.status)}15` }]}>
                      <Text style={[styles.orderStatusText, { color: getOrderStatusColor(order.status) }]}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderCustomer}>{order.customer}</Text>
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderItems}>{order.items} items</Text>
                    <Text style={styles.orderDot}>•</Text>
                    <Text style={styles.orderTime}>{order.time}</Text>
                  </View>
                </View>
                <Text style={[styles.orderTotal, { color: supplierColor }]}>₹{order.total.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Top Selling Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Sellers</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: supplierColor }]}>View all</Text>
              </TouchableOpacity>
            </View>
            {topProducts.map((product, index) => (
              <View key={product.id} style={styles.topProductCard}>
                <View style={styles.topProductRank}>
                  <Text style={styles.topProductRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topProductInfo}>
                  <Text style={styles.topProductName}>{product.name}</Text>
                  <Text style={styles.topProductSales}>{product.sales} sold this month</Text>
                </View>
                <View style={styles.topProductRevenue}>
                  <Text style={[styles.topProductRevenueValue, { color: supplierColor }]}>
                    ₹{(product.revenue / 1000).toFixed(1)}K
                  </Text>
                  <Text style={styles.topProductStock}>{product.stock} left</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Low Stock Alert */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Low Stock Alert</Text>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeText}>{lowStockItems.length}</Text>
              </View>
            </View>
            <View style={styles.lowStockCard}>
              {lowStockItems.map((item) => (
                <View key={item.id} style={styles.lowStockItem}>
                  <View style={styles.lowStockIcon}>
                    <Ionicons name="warning" size={18} color="#F59E0B" />
                  </View>
                  <View style={styles.lowStockInfo}>
                    <Text style={styles.lowStockName}>{item.name}</Text>
                    <Text style={styles.lowStockCount}>
                      Only {item.stock} left (min: {item.threshold})
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.restockBtn}>
                    <Text style={styles.restockBtnText}>Restock</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>A</Text>
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>Anita Desai</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name="star" size={14} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>2 days ago</Text>
              </View>
              <Text style={styles.reviewText}>
                "Great quality products! Fast delivery and excellent packaging. Will order again!"
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Other Provider Dashboard (VET, GROOMER, LOVER)
  if (!isOwner) {
    const providerConfig = getProviderConfig();

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={providerConfig.color} />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'there'}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={24} color={colors.gray[700]} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>

          {/* Role Badge */}
          <View style={styles.roleBadgeContainer}>
            <View style={[styles.roleBadge, { backgroundColor: `${providerConfig.color}15` }]}>
              <Ionicons name={providerConfig.icon as any} size={18} color={providerConfig.color} />
              <Text style={[styles.roleBadgeText, { color: providerConfig.color }]}>{providerConfig.title}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.providerStats}>
            <View style={styles.providerStatCard}>
              <Text style={styles.providerStatValue}>4</Text>
              <Text style={styles.providerStatLabel}>Today</Text>
            </View>
            <View style={styles.providerStatCard}>
              <Text style={styles.providerStatValue}>4.9</Text>
              <Text style={styles.providerStatLabel}>Rating</Text>
            </View>
            <View style={styles.providerStatCard}>
              <Text style={styles.providerStatValue}>₹12K</Text>
              <Text style={styles.providerStatLabel}>Earnings</Text>
            </View>
          </View>

          {/* Quick Actions for Providers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.providerActionsRow}>
              <TouchableOpacity style={styles.providerActionItem}>
                <View style={[styles.providerActionIcon, { backgroundColor: `${providerConfig.color}15` }]}>
                  <Ionicons name={providerConfig.icon as any} size={24} color={providerConfig.color} />
                </View>
                <Text style={styles.providerActionLabel}>Manage {providerConfig.listingLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.providerActionItem} onPress={() => navigation.navigate('Calendar')}>
                <View style={[styles.providerActionIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="calendar" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.providerActionLabel}>Calendar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.providerActionsRow}>
              <TouchableOpacity style={styles.providerActionItem}>
                <View style={[styles.providerActionIcon, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="analytics" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.providerActionLabel}>Analytics</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.providerActionItem}>
                <View style={[styles.providerActionIcon, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="wallet" size={24} color="#10B981" />
                </View>
                <Text style={styles.providerActionLabel}>Earnings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                <Text style={[styles.seeAllText, { color: providerConfig.color }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.todayBookings}>
              <TouchableOpacity style={styles.bookingCard}>
                <View style={[styles.bookingIcon, { backgroundColor: `${providerConfig.color}15` }]}>
                  <Ionicons name="person" size={22} color={providerConfig.color} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>Rahul Kumar</Text>
                  <Text style={styles.bookingSubtitle}>Consultation</Text>
                </View>
                <View style={styles.bookingTime}>
                  <Text style={[styles.bookingDate, { color: providerConfig.color }]}>10:00 AM</Text>
                  <Text style={styles.bookingTimeText}>30 min</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bookingCard}>
                <View style={[styles.bookingIcon, { backgroundColor: `${providerConfig.color}15` }]}>
                  <Ionicons name="person" size={22} color={providerConfig.color} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>Priya Sharma</Text>
                  <Text style={styles.bookingSubtitle}>Follow-up</Text>
                </View>
                <View style={styles.bookingTime}>
                  <Text style={[styles.bookingDate, { color: providerConfig.color }]}>2:30 PM</Text>
                  <Text style={styles.bookingTimeText}>45 min</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>A</Text>
                </View>
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewName}>Anita Desai</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name="star" size={14} color="#F59E0B" />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewDate}>2 days ago</Text>
              </View>
              <Text style={styles.reviewText}>
                "Excellent service! Very professional and caring. Will definitely recommend."
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Pet Owner Dashboard
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'there'}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.gray[700]} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <TouchableOpacity style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="paw" size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickStatValue}>{stats.petsCount}</Text>
            <Text style={styles.quickStatLabel}>Pets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.quickStatValue}>{stats.bookingsCount}</Text>
            <Text style={styles.quickStatLabel}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#8B5CF615' }]}>
              <Ionicons name="chatbubble" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.quickStatValue}>{stats.messagesCount}</Text>
            <Text style={styles.quickStatLabel}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <TouchableOpacity key={booking.id} style={styles.bookingCard}>
                <View style={[styles.bookingIcon, { backgroundColor: booking.type === 'vet' ? '#10B98115' : '#8B5CF615' }]}>
                  <Ionicons
                    name={booking.type === 'vet' ? 'medical' : 'cut'}
                    size={22}
                    color={booking.type === 'vet' ? '#10B981' : '#8B5CF6'}
                  />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>{booking.service}</Text>
                  <Text style={styles.bookingSubtitle}>{booking.providerName}</Text>
                </View>
                <View style={styles.bookingTime}>
                  <Text style={styles.bookingDate}>{booking.date}</Text>
                  <Text style={styles.bookingTimeText}>{booking.time}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyBookings}>
              <Ionicons name="calendar-outline" size={40} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No upcoming appointments</Text>
              <TouchableOpacity style={styles.bookNowBtn}>
                <Text style={styles.bookNowText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="medical" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionLabel}>Find Vet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="cut" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.actionLabel}>Grooming</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="storefront" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="calendar" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionLabel}>Events</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearby Providers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Providers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View map</Text>
            </TouchableOpacity>
          </View>
          {nearbyProviders.map((provider) => (
            <TouchableOpacity key={provider.id} style={styles.providerCard}>
              <View style={[styles.providerAvatar, { backgroundColor: `${getTypeColor(provider.type)}15` }]}>
                <Ionicons name={getTypeIcon(provider.type) as any} size={22} color={getTypeColor(provider.type)} />
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerType}>{provider.type}</Text>
              </View>
              <View style={styles.providerMeta}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{provider.rating}</Text>
                </View>
                <Text style={styles.distanceText}>{provider.distance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pet Care Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pet Care Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
            <TouchableOpacity style={[styles.tipCard, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="water" size={28} color="#0EA5E9" />
              <Text style={styles.tipTitle}>Hydration</Text>
              <Text style={styles.tipText}>Ensure fresh water is always available</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tipCard, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="sunny" size={28} color="#F59E0B" />
              <Text style={styles.tipTitle}>Exercise</Text>
              <Text style={styles.tipText}>Daily walks keep your pet healthy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tipCard, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="nutrition" size={28} color="#22C55E" />
              <Text style={styles.tipTitle}>Nutrition</Text>
              <Text style={styles.tipText}>Balanced diet for a happy pet</Text>
            </TouchableOpacity>
          </ScrollView>
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
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: colors.gray[500],
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickStatItem: {
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
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray[900],
  },
  quickStatLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  section: {
    marginTop: 24,
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
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  bookingCard: {
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
  bookingIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  bookingSubtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  bookingTime: {
    alignItems: 'flex-end',
  },
  bookingDate: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  bookingTimeText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  emptyBookings: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 12,
  },
  bookNowBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookNowText: {
    color: colors.white,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionItem: {
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  providerCard: {
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
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  providerType: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  providerMeta: {
    alignItems: 'flex-end',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
  },
  distanceText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  tipsScroll: {
    marginTop: 12,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tipCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 10,
  },
  tipText: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 4,
    lineHeight: 16,
  },
  // Provider styles
  providerStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  providerStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  providerStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gray[900],
  },
  providerStatLabel: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  // Role Badge styles
  roleBadgeContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Provider action styles
  providerActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  providerActionItem: {
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
  providerActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
  },
  todayBookings: {},
  // Review styles
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray[600],
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray[500],
  },
  reviewText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Supplier Dashboard styles
  revenueCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  revenueMain: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  revenueLabel: {
    fontSize: 14,
    color: colors.gray[500],
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  revenueChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  revenueChangeText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: colors.gray[100],
    marginVertical: 16,
  },
  revenueSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  revenueItem: {
    alignItems: 'center',
  },
  revenueItemLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  revenueItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 4,
  },
  orderStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  orderStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
  },
  orderStatLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  orderCard: {
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
  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[900],
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderCustomer: {
    fontSize: 13,
    color: colors.gray[700],
    marginTop: 2,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  orderItems: {
    fontSize: 12,
    color: colors.gray[500],
  },
  orderDot: {
    fontSize: 12,
    color: colors.gray[400],
    marginHorizontal: 6,
  },
  orderTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  topProductCard: {
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
  topProductRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  topProductRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
  },
  topProductInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  topProductSales: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  topProductRevenue: {
    alignItems: 'flex-end',
  },
  topProductRevenueValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  topProductStock: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 2,
  },
  alertBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  lowStockCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  lowStockIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F59E0B15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowStockInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lowStockName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[900],
  },
  lowStockCount: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  restockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#3B82F615',
  },
  restockBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
