import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, roleColors } from '../../theme/colors';

// Use centralized role color
const CAFE_COLOR = roleColors.CAFE;

type CustomerSegment = 'all' | 'vip' | 'regular' | 'new' | 'inactive';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  petName?: string;
  petType?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string;
  segment: 'vip' | 'regular' | 'new' | 'inactive';
  notes?: string;
  favoriteItems?: string[];
  tags?: string[];
}

export default function CafeCRMScreen() {
  const navigation = useNavigation<any>();
  const [activeSegment, setActiveSegment] = useState<CustomerSegment>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Mock customer data
  const customers: Customer[] = [
    {
      id: '1',
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.sharma@email.com',
      avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      petName: 'Bruno',
      petType: 'Golden Retriever',
      totalVisits: 24,
      totalSpent: 15600,
      lastVisit: '2025-02-10',
      segment: 'vip',
      notes: 'Prefers corner table, Bruno loves chicken treats',
      favoriteItems: ['Cappuccino', 'Chicken Sandwich', 'Pup-cakes'],
      tags: ['Birthday Club', 'Event Regular'],
    },
    {
      id: '2',
      name: 'Rahul Verma',
      phone: '+91 87654 32109',
      avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      petName: 'Whiskers',
      petType: 'Persian Cat',
      totalVisits: 12,
      totalSpent: 8400,
      lastVisit: '2025-02-08',
      segment: 'regular',
      favoriteItems: ['Green Tea', 'Cat Treats'],
      tags: ['Cat Parent'],
    },
    {
      id: '3',
      name: 'Anita Desai',
      phone: '+91 76543 21098',
      email: 'anita.d@email.com',
      avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
      petName: 'Max',
      petType: 'Labrador',
      totalVisits: 8,
      totalSpent: 4200,
      lastVisit: '2025-02-05',
      segment: 'regular',
      tags: ['Weekend Regular'],
    },
    {
      id: '4',
      name: 'Vikram Singh',
      phone: '+91 65432 10987',
      avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
      petName: 'Cookie',
      petType: 'Beagle',
      totalVisits: 3,
      totalSpent: 1800,
      lastVisit: '2025-02-01',
      segment: 'new',
      tags: ['First Timer'],
    },
    {
      id: '5',
      name: 'Meera Patel',
      phone: '+91 54321 09876',
      avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
      petName: 'Simba',
      petType: 'Indie Dog',
      totalVisits: 15,
      totalSpent: 9200,
      lastVisit: '2024-12-15',
      segment: 'inactive',
      notes: 'Has not visited in 2 months',
      tags: ['Needs Re-engagement'],
    },
  ];

  const segments: { id: CustomerSegment; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: customers.length },
    { id: 'vip', label: 'VIP', count: customers.filter(c => c.segment === 'vip').length },
    { id: 'regular', label: 'Regular', count: customers.filter(c => c.segment === 'regular').length },
    { id: 'new', label: 'New', count: customers.filter(c => c.segment === 'new').length },
    { id: 'inactive', label: 'Inactive', count: customers.filter(c => c.segment === 'inactive').length },
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSegment = activeSegment === 'all' || customer.segment === activeSegment;
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.petName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSegment && matchesSearch;
  });

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip': return '#F59E0B';
      case 'regular': return CAFE_COLOR;
      case 'new': return '#10B981';
      case 'inactive': return '#EF4444';
      default: return colors.gray[400];
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const stats = {
    totalCustomers: customers.length,
    vipCustomers: customers.filter(c => c.segment === 'vip').length,
    avgSpent: Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length),
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer CRM</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="download-outline" size={24} color={CAFE_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CAFE_COLOR} />}
      >
        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <View style={[styles.statCard, { backgroundColor: CAFE_COLOR }]}>
            <Ionicons name="people" size={24} color={colors.white} />
            <Text style={styles.statValue}>{stats.totalCustomers}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="star" size={24} color={colors.white} />
            <Text style={styles.statValue}>{stats.vipCustomers}</Text>
            <Text style={styles.statLabel}>VIP Members</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="wallet" size={24} color={colors.white} />
            <Text style={styles.statValue}>{stats.avgSpent.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Avg. Spent</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <Ionicons name="cash" size={24} color={colors.white} />
            <Text style={styles.statValue}>{(stats.totalRevenue / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or pet..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray[400]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Segment Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segmentsScroll}>
          {segments.map((segment) => (
            <TouchableOpacity
              key={segment.id}
              style={[
                styles.segmentTab,
                activeSegment === segment.id && { backgroundColor: CAFE_COLOR },
              ]}
              onPress={() => setActiveSegment(segment.id)}
            >
              <Text style={[
                styles.segmentText,
                activeSegment === segment.id && styles.segmentTextActive,
              ]}>
                {segment.label}
              </Text>
              <View style={[
                styles.segmentBadge,
                activeSegment === segment.id && styles.segmentBadgeActive,
              ]}>
                <Text style={[
                  styles.segmentBadgeText,
                  activeSegment === segment.id && styles.segmentBadgeTextActive,
                ]}>
                  {segment.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Customer List */}
        <View style={styles.customerList}>
          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No customers found</Text>
            </View>
          ) : (
            filteredCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={styles.customerCard}
                onPress={() => {
                  setSelectedCustomer(customer);
                  setShowCustomerModal(true);
                }}
              >
                <View style={styles.customerHeader}>
                  {customer.avatar ? (
                    <Image source={{ uri: customer.avatar }} style={styles.customerAvatar} />
                  ) : (
                    <View style={[styles.customerAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>{customer.name.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.customerInfo}>
                    <View style={styles.customerNameRow}>
                      <Text style={styles.customerName}>{customer.name}</Text>
                      <View style={[styles.segmentLabel, { backgroundColor: `${getSegmentColor(customer.segment)}15` }]}>
                        <Text style={[styles.segmentLabelText, { color: getSegmentColor(customer.segment) }]}>
                          {customer.segment.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                    {customer.petName && (
                      <View style={styles.petInfo}>
                        <Ionicons name="paw" size={12} color={CAFE_COLOR} />
                        <Text style={styles.petText}>{customer.petName} ({customer.petType})</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.customerStats}>
                  <View style={styles.customerStatItem}>
                    <Text style={styles.customerStatValue}>{customer.totalVisits}</Text>
                    <Text style={styles.customerStatLabel}>Visits</Text>
                  </View>
                  <View style={styles.customerStatDivider} />
                  <View style={styles.customerStatItem}>
                    <Text style={styles.customerStatValue}>{customer.totalSpent.toLocaleString()}</Text>
                    <Text style={styles.customerStatLabel}>Total Spent</Text>
                  </View>
                  <View style={styles.customerStatDivider} />
                  <View style={styles.customerStatItem}>
                    <Text style={styles.customerStatValue}>{formatDate(customer.lastVisit)}</Text>
                    <Text style={styles.customerStatLabel}>Last Visit</Text>
                  </View>
                </View>

                {customer.tags && customer.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {customer.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Customer Detail Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        {selectedCustomer && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={28} color={colors.gray[900]} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Customer Profile</Text>
              <TouchableOpacity>
                <Ionicons name="create-outline" size={24} color={CAFE_COLOR} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                {selectedCustomer.avatar ? (
                  <Image source={{ uri: selectedCustomer.avatar }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
                    <Text style={styles.profileAvatarInitial}>{selectedCustomer.name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.profileName}>{selectedCustomer.name}</Text>
                <View style={[styles.segmentLabel, { backgroundColor: `${getSegmentColor(selectedCustomer.segment)}15` }]}>
                  <Text style={[styles.segmentLabelText, { color: getSegmentColor(selectedCustomer.segment) }]}>
                    {selectedCustomer.segment.toUpperCase()} CUSTOMER
                  </Text>
                </View>
              </View>

              {/* Contact Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={colors.gray[500]} />
                  <Text style={styles.infoText}>{selectedCustomer.phone}</Text>
                </View>
                {selectedCustomer.email && (
                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={20} color={colors.gray[500]} />
                    <Text style={styles.infoText}>{selectedCustomer.email}</Text>
                  </View>
                )}
              </View>

              {/* Pet Info */}
              {selectedCustomer.petName && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pet Information</Text>
                  <View style={styles.petCard}>
                    <View style={[styles.petIcon, { backgroundColor: `${CAFE_COLOR}15` }]}>
                      <Ionicons name="paw" size={24} color={CAFE_COLOR} />
                    </View>
                    <View>
                      <Text style={styles.petName}>{selectedCustomer.petName}</Text>
                      <Text style={styles.petBreed}>{selectedCustomer.petType}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Statistics */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity Summary</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>{selectedCustomer.totalVisits}</Text>
                    <Text style={styles.statBoxLabel}>Total Visits</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>{selectedCustomer.totalSpent.toLocaleString()}</Text>
                    <Text style={styles.statBoxLabel}>Total Spent</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxValue}>{Math.round(selectedCustomer.totalSpent / selectedCustomer.totalVisits)}</Text>
                    <Text style={styles.statBoxLabel}>Avg. per Visit</Text>
                  </View>
                </View>
              </View>

              {/* Favorite Items */}
              {selectedCustomer.favoriteItems && selectedCustomer.favoriteItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Favorite Items</Text>
                  <View style={styles.favoritesContainer}>
                    {selectedCustomer.favoriteItems.map((item, index) => (
                      <View key={index} style={styles.favoriteItem}>
                        <Ionicons name="heart" size={14} color={CAFE_COLOR} />
                        <Text style={styles.favoriteText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Notes */}
              {selectedCustomer.notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.notesText}>{selectedCustomer.notes}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: CAFE_COLOR }]}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.white} />
                  <Text style={styles.actionButtonText}>Send Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.actionButtonOutline]}>
                  <Ionicons name="gift-outline" size={20} color={CAFE_COLOR} />
                  <Text style={[styles.actionButtonText, { color: CAFE_COLOR }]}>Send Offer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.gray[900] },
  headerAction: { padding: 4 },
  statsScroll: { paddingLeft: 20, marginBottom: 16 },
  statCard: {
    width: 120,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.white, marginTop: 8 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: colors.gray[900] },
  segmentsScroll: { paddingLeft: 20, marginBottom: 16 },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    marginRight: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.gray[600] },
  segmentTextActive: { color: colors.white },
  segmentBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
  },
  segmentBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  segmentBadgeText: { fontSize: 12, fontWeight: '600', color: colors.gray[600] },
  segmentBadgeTextActive: { color: colors.white },
  customerList: { paddingHorizontal: 20 },
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
  customerHeader: { flexDirection: 'row', marginBottom: 16 },
  customerAvatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    backgroundColor: `${CAFE_COLOR}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 20, fontWeight: 'bold', color: CAFE_COLOR },
  customerInfo: { flex: 1, marginLeft: 12 },
  customerNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  customerName: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginRight: 8 },
  segmentLabel: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  segmentLabelText: { fontSize: 10, fontWeight: '700' },
  customerPhone: { fontSize: 13, color: colors.gray[500], marginBottom: 4 },
  petInfo: { flexDirection: 'row', alignItems: 'center' },
  petText: { fontSize: 13, color: CAFE_COLOR, marginLeft: 4 },
  customerStats: {
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  customerStatItem: { flex: 1, alignItems: 'center' },
  customerStatValue: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  customerStatLabel: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  customerStatDivider: { width: 1, backgroundColor: colors.gray[200] },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: `${CAFE_COLOR}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { fontSize: 12, color: CAFE_COLOR, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: colors.gray[400], marginTop: 12 },
  // Modal styles
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  modalContent: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: 24 },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  profileAvatarInitial: { fontSize: 36, fontWeight: 'bold', color: CAFE_COLOR },
  profileName: { fontSize: 24, fontWeight: 'bold', color: colors.gray[900], marginBottom: 8 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[500], marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 15, color: colors.gray[700], marginLeft: 12 },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
  },
  petIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  petName: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  petBreed: { fontSize: 14, color: colors.gray[500], marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statBoxValue: { fontSize: 20, fontWeight: 'bold', color: CAFE_COLOR },
  statBoxLabel: { fontSize: 11, color: colors.gray[500], marginTop: 4 },
  favoritesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${CAFE_COLOR}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  favoriteText: { fontSize: 14, color: CAFE_COLOR, marginLeft: 6 },
  notesCard: {
    backgroundColor: colors.gray[50],
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: CAFE_COLOR,
  },
  notesText: { fontSize: 14, color: colors.gray[700], lineHeight: 20 },
  actionButtons: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: CAFE_COLOR,
  },
  actionButtonText: { fontSize: 15, fontWeight: '600', color: colors.white },
});
